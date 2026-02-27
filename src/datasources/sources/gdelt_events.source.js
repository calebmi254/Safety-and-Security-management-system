/**
 * GDELT Source Adapter — Event 2.1 File Feed (Structured Events Tier)
 *
 * This adapter is responsible for:
 *   1. Polling GDELT 2.1's `lastupdate.txt` for new file availability
 *   2. Stream-downloading the latest `.export.CSV.zip` file
 *   3. Unzipping and parsing the TSV data on-the-fly (Streaming)
 *   4. Mapping CAMEO events/Goldstein scale to SecureX schema
 *   5. ENRICHMENT: Extracting real-world headlines from SOURCEURL
 *   6. Inserting into the `events` table (with GLOBALEVENTID deduplication)
 *   7. Updating `ingestion_state` checkpoint
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const csv = require('csv-parser');
const { pool } = require('../../config/db');
const logger = require('../../utils/logger');
const mapper = require('../utils/severity.mapper');

// --- Configuration -------------------------------------------------------

const BASE_URL = 'http://data.gdeltproject.org/gdeltv2/';
const LAST_UPDATE_URL = BASE_URL + 'lastupdate.txt';
const SOURCE = 'gdelt_event';

// GDELT 2.1 Event CSV Column Headers
const GDELT_COLUMNS = [
    'GLOBALEVENTID', 'SQLDATE', 'MonthYear', 'Year', 'FractionDate',
    'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode', 'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code', 'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code',
    'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode', 'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code', 'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code',
    'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode', 'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources', 'NumArticles', 'AvgTone',
    'Actor1Geo_Type', 'Actor1Geo_FullName', 'Actor1Geo_CountryCode', 'Actor1Geo_ADM1Code', 'Actor1Geo_ADM2Code', 'Actor1Geo_Lat', 'Actor1Geo_Long', 'Actor1Geo_FeatureID',
    'Actor2Geo_Type', 'Actor2Geo_FullName', 'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code', 'Actor2Geo_ADM2Code', 'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID',
    'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode', 'ActionGeo_ADM1Code', 'ActionGeo_ADM2Code', 'ActionGeo_Lat', 'ActionGeo_Long', 'ActionGeo_FeatureID',
    'DATEADDED', 'SOURCEURL'
];

// --- Core Enrichment -----------------------------------------------------

/**
 * Lightweight helper to extract the <title> from a URL.
 * Scans only the first 10KB of the response to minimize latency.
 */
async function extractHeadline(url) {
    if (!url) return null;
    try {
        const response = await axios.get(url, {
            timeout: 3000,
            headers: { 'User-Agent': 'Mozilla/5.0 (SecureX Intelligence Platform)' },
            responseType: 'stream'
        });

        let chunk = '';
        return new Promise((resolve) => {
            response.data.on('data', (c) => {
                chunk += c.toString();
                if (chunk.length > 10000 || chunk.toLowerCase().includes('</title>')) {
                    response.data.destroy();
                    const match = chunk.match(/<title>([^<]*)<\/title>/i);
                    if (match && match[1]) {
                        // Clean up title (remove excess whitespace, common suffixes)
                        let title = match[1].trim()
                            .replace(/&amp;/g, '&')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .split('|')[0]   // Remove site name suffixes
                            .split('-')[0]
                            .trim();
                        resolve(title);
                    }
                    resolve(null);
                }
            });
            response.data.on('end', () => resolve(null));
            response.data.on('error', () => resolve(null));
        });
    } catch (err) {
        return null; // Silent fail for headline extraction
    }
}

// --- Core Logic ----------------------------------------------------------

async function getLatestFileMetadata() {
    const response = await axios.get(LAST_UPDATE_URL, { timeout: 10000 });
    const lines = response.data.trim().split('\n');
    const exportLine = lines[0].split(' ');
    const url = exportLine[2];
    const filename = path.basename(url);
    return { url, filename };
}

function decodeActor(name, code, countryCode) {
    if (name) return name;
    if (!code) return 'Unidentified';
    const c = code.toUpperCase();
    let typeLabel = '';
    if (c.includes('GOV')) typeLabel = 'Govt Officials';
    else if (c.includes('MIL')) typeLabel = 'Military';
    else if (c.includes('COP')) typeLabel = 'Police';
    else if (c.includes('REB')) typeLabel = 'Rebels';
    else if (c.includes('CVL') || c.includes('CIV')) typeLabel = 'Civilians';
    else if (c.includes('REB')) typeLabel = 'Insurgents';

    if (typeLabel) {
        if (countryCode && countryCode.length === 3) return `${countryCode} ${typeLabel}`;
        return typeLabel;
    }
    if (countryCode && countryCode.length === 3) return countryCode;
    return code;
}

async function processEventRow(row, shouldEnrich = false) {
    const lat = parseFloat(row.ActionGeo_Lat);
    const lon = parseFloat(row.ActionGeo_Long);
    if (isNaN(lat) || isNaN(lon)) return false;

    const root = (row.EventRootCode || '').toString().padStart(2, '0');
    const base = (row.EventCode || '').toString().padStart(3, '0');

    const actionDictionary = {
        '01': { label: 'Public Statement', cat: 'security_incident' },
        '10': { label: 'Demand', cat: 'security_incident' },
        '11': { label: 'Public Disapproval', cat: 'protest' },
        '14': { label: 'Protest', cat: 'protest' },
        '18': { label: 'Assault/Attack', cat: 'armed_attack' },
        '19': { label: 'Violent Clash', cat: 'violent_clash' }
    };

    const subActions = {
        '182': 'Physical Assault', '183': 'Bombing', '190': 'Fight with Weapons', '191': 'Firefight', '145': 'Riot/Violent Protest'
    };

    const rootInfo = actionDictionary[root] || { label: 'Security Incident', cat: 'security_incident' };
    const finalActionLabel = subActions[base] || rootInfo.label;

    const actor1 = decodeActor(row.Actor1Name, row.Actor1Code, row.Actor1CountryCode);
    const actor2 = decodeActor(row.Actor2Name, row.Actor2Code, row.Actor2CountryCode);

    // Technical SitRep (Technical fallback if title extraction fails)
    const sitrep = `${finalActionLabel} involving ${actor1} and ${actor2} in ${row.ActionGeo_FullName || 'Global'}.`;

    // Attempt Title Enrichment
    let headline = null;
    if (shouldEnrich && row.SOURCEURL) {
        headline = await extractHeadline(row.SOURCEURL);
        if (headline) logger.debug(`[GDELT_EVENT] Extracted Headline: ${headline}`);
    }

    const event = {
        source: SOURCE,
        external_id: row.GLOBALEVENTID,
        event_category: rootInfo.cat,
        severity: mapper.calculateSeverityFromGoldstein(parseFloat(row.GoldsteinScale)),
        intensity: parseFloat(row.GoldsteinScale),
        title: headline, // Real-world headline
        description: sitrep, // Technical SitRep
        source_url: row.SOURCEURL,
        actors: JSON.stringify({
            actor1: row.Actor1Name || row.Actor1Code,
            actor2: row.Actor2Name || row.Actor2Code,
            source_url: row.SOURCEURL,
            event_code: row.EventCode
        }),
        location: `POINT(${lon} ${lat})`,
        country: row.ActionGeo_CountryCode,
        occurred_at: row.SQLDATE ? new Date(row.SQLDATE.slice(0, 4), row.SQLDATE.slice(4, 6) - 1, row.SQLDATE.slice(6, 8)) : new Date()
    };

    try {
        const result = await pool.query(
            `INSERT INTO events 
                (source, external_id, event_category, severity, intensity, title, description, actors, location, country, source_url, occurred_at)
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, ST_GeographyFromText($9), $10, $11, $12)
             ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
             DO UPDATE SET 
                title = COALESCE(EXCLUDED.title, events.title),
                description = EXCLUDED.description,
                intensity = EXCLUDED.intensity,
                source_url = EXCLUDED.source_url,
                updated_at = NOW()
             RETURNING id`,
            [event.source, event.external_id, event.event_category, event.severity, event.intensity, event.title, event.description, event.actors, event.location, event.country, event.source_url, event.occurred_at]
        );
        return result.rows.length > 0;
    } catch (err) {
        logger.error(`[GDELT_EVENT] DB Insert error: ${err.message}`);
        return false;
    }
}

async function ingestEvents() {
    logger.info('[GDELT_EVENT] Starting enriched event ingestion...');
    try {
        const { url, filename } = await getLatestFileMetadata();
        const stateRes = await pool.query("SELECT last_file_processed FROM ingestion_state WHERE source = 'gdelt_event'");
        const lastFile = stateRes.rows[0]?.last_file_processed;

        if (lastFile === filename) {
            logger.info(`[GDELT_EVENT] Latest file ${filename} already processed.`);
            return { status: 'skipped' };
        }

        const rows = [];
        const response = await axios({ method: 'GET', url, responseType: 'stream' });

        await new Promise((resolve, reject) => {
            response.data
                .pipe(unzipper.ParseOne())
                .pipe(csv({ separator: '\t', headers: GDELT_COLUMNS, strict: false }))
                .on('data', (row) => {
                    const lat = parseFloat(row.ActionGeo_Lat);
                    const lon = parseFloat(row.ActionGeo_Long);
                    if (!isNaN(lat) && !isNaN(lon)) rows.push(row);
                })
                .on('end', async () => {
                    // PRIORITIZATION: Sort by NumMentions (impact) so we enrich the most significant news first
                    rows.sort((a, b) => parseInt(b.NumMentions || 0) - parseInt(a.NumMentions || 0));

                    logger.info(`[GDELT_EVENT] Processing ${rows.length} events (Enriching first 50 prioritized by impact)...`);

                    let inserted = 0;
                    // We'll enrich the top 50 rows to provide high-quality content for the landing page
                    for (let i = 0; i < rows.length; i++) {
                        const wasInserted = await processEventRow(rows[i], i < 50);
                        if (wasInserted) inserted++;
                        if (i % 10 === 0 && i < 50) logger.info(`[GDELT_EVENT] Enrichment progress: ${i}/50 headlines fetched.`);
                    }

                    await pool.query(
                        `UPDATE ingestion_state SET last_synced_at = NOW(), last_file_processed = $1 WHERE source = 'gdelt_event'`,
                        [filename]
                    );
                    resolve({ inserted });
                })
                .on('error', reject);
        });
        return { status: 'success' };
    } catch (error) {
        logger.error(`[GDELT_EVENT] Ingestion run failed: ${error.message}`);
        return { status: 'error', error: error.message };
    }
}

module.exports = { ingestEvents };
