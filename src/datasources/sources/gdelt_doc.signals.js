/**
 * GDELT Source Adapter — DOC 2.0 JSON API (Signals Tier)
 *
 * This adapter is responsible for:
 *   1. Fetching articles from the GDELT DOC 2.0 API
 *   2. Transforming article data into the "Media Signal" schema
 *   3. Inserting into the `media_signals` table (with deduplication)
 *   4. Updating `ingestion_state` checkpoint
 *
 * NOTE: This is our early-warning "Signal" tier. It handles unverified media 
 * reports. Structured events (GDELT 2.1) are handled by a separate adapter.
 */

const axios = require('axios');
const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

// --- Configuration -------------------------------------------------------

const GDELT_DOC_API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const SOURCE = 'GDELT_DOC';

const GDELT_QUERY_PARAMS = {
    query: '(protest OR violence)',
    mode: 'ArtList',
    format: 'json',
    maxrecords: '20',
    sort: 'DateDesc',
};

// --- Transformer ---------------------------------------------------------

/**
 * Transforms a raw GDELT DOC 2.0 article into the media_signals schema.
 * @param {Object} article 
 * @returns {Object}
 */
function transformArticleToSignal(article) {
    const tone = article.tone ? parseFloat(article.tone) : 0;

    return {
        source: SOURCE,
        external_id: article.url, // URL is the unique ID for news signals
        title: article.title || 'No title available',
        url: article.url,
        tone: tone,
        country: article.sourcecountry || null,
        language: article.language || null,
        occurred_at: article.seendate ? parseGdeltDate(article.seendate) : new Date().toISOString()
    };
}

/**
 * Parses GDELT's date format (YYYYMMDDTHHmmssZ) into an ISO string.
 */
function parseGdeltDate(gdeltDate) {
    try {
        const y = gdeltDate.slice(0, 4);
        const mo = gdeltDate.slice(4, 6);
        const d = gdeltDate.slice(6, 8);
        const h = gdeltDate.slice(9, 11);
        const mi = gdeltDate.slice(11, 13);
        const s = gdeltDate.slice(13, 15);
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString();
    } catch {
        return new Date().toISOString();
    }
}

// --- Database operations -------------------------------------------------

/**
 * Inserts a signal into the media_signals table.
 */
async function insertSignal(signal) {
    const result = await pool.query(
        `INSERT INTO media_signals
            (source, external_id, title, url, tone, country, language, occurred_at)
         VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (source, external_id)
         DO NOTHING
         RETURNING id`,
        [
            signal.source,
            signal.external_id,
            signal.title,
            signal.url,
            signal.tone,
            signal.country,
            signal.language,
            signal.occurred_at
        ]
    );

    return result.rows.length > 0;
}

/**
 * Updates the ingestion_state checkpoint.
 */
async function updateCheckpoint(count, status, errorMessage = null) {
    await pool.query(
        `UPDATE ingestion_state
         SET last_synced_at = NOW(),
             last_run_count = $1,
             last_run_status = $2,
             last_error = $3,
             updated_at = NOW()
         WHERE source = 'gdelt'`,
        [count, status, errorMessage]
    );
}

// --- Main Ingestion Function ---------------------------------------------

async function ingestSignals() {
    logger.info('[GDELT_DOC] Starting signal ingestion run...');

    let inserted = 0;
    let skipped = 0;

    try {
        const params = new URLSearchParams(GDELT_QUERY_PARAMS).toString();
        const url = `${GDELT_DOC_API_URL}?${params}`;

        const response = await axios.get(url, { timeout: 30000 });
        const articles = response.data?.articles;

        if (!articles || articles.length === 0) {
            logger.warn('[GDELT_DOC] No articles returned from API.');
            await updateCheckpoint(0, 'success', null);
            return { inserted: 0, skipped: 0, total: 0, status: 'success' };
        }

        for (const article of articles) {
            try {
                const signal = transformArticleToSignal(article);
                const wasInserted = await insertSignal(signal);
                if (wasInserted) {
                    inserted++;
                } else {
                    skipped++;
                }
            } catch (err) {
                logger.warn(`[GDELT_DOC] Skipped signal due to error: ${err.message}`);
                skipped++;
            }
        }

        await updateCheckpoint(inserted, 'success', null);
        logger.info(`[GDELT_DOC] Run complete — Inserted: ${inserted}, Skipped: ${skipped}`);

        return { source: SOURCE, inserted, skipped, total: articles.length, status: 'success' };

    } catch (error) {
        logger.error(`[GDELT_DOC] Ingestion run failed: ${error.message}`);
        await updateCheckpoint(inserted, 'error', error.message);
        return { source: SOURCE, inserted, skipped, status: 'error', error: error.message };
    }
}

module.exports = { ingestSignals };
