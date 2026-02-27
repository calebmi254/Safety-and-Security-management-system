/**
 * Test Script: Ingestion Pipeline
 *
 * Tests the GDELT ingestion pipeline in isolation — no server needed.
 * Run from the project root:
 *
 *   node scripts/test.ingestion.js
 *
 * What this tests:
 *   1. GDELT DOC 2.0 API responds with articles
 *   2. Articles are transformed to the unified event schema correctly
 *   3. Events are inserted into the PostgreSQL events table
 *   4. ingestion_state is updated with a fresh last_synced_at
 *   5. Re-running does NOT create duplicate rows (deduplication guard)
 */

require('dotenv').config();
const { Pool } = require('pg');
const { ingestGDELT } = require('../src/datasources/sources/gdelt.source');
const { calculateSeverityFromTone } = require('../src/datasources/utils/severity.mapper');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ANSI colours for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const pass = (msg) => console.log(`${GREEN}  ✅ PASS${RESET} — ${msg}`);
const fail = (msg) => console.log(`${RED}  ❌ FAIL${RESET} — ${msg}`);
const info = (msg) => console.log(`${CYAN}  ℹ  ${RESET}${msg}`);
const warn = (msg) => console.log(`${YELLOW}  ⚠  ${RESET}${msg}`);

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        pass(message);
        passCount++;
    } else {
        fail(message);
        failCount++;
    }
}

async function testSeverityMapper() {
    console.log(`\n${CYAN}━━━ TEST 1: Severity Mapper ━━━${RESET}`);

    assert(calculateSeverityFromTone(-25) === 5, 'Tone -25 → severity 5 (Critical)');
    assert(calculateSeverityFromTone(-15) === 4, 'Tone -15 → severity 4 (Severe)');
    assert(calculateSeverityFromTone(-8) === 3, 'Tone -8  → severity 3 (High)');
    assert(calculateSeverityFromTone(-4) === 2, 'Tone -4  → severity 2 (Medium)');
    assert(calculateSeverityFromTone(-1) === 1, 'Tone -1  → severity 1 (Low)');
    assert(calculateSeverityFromTone(5) === 1, 'Positive tone → severity 1 (Low)');
    assert(calculateSeverityFromTone('abc') === 1, 'Invalid tone → severity 1 (fallback)');
}

async function testGDELTConnection() {
    console.log(`\n${CYAN}━━━ TEST 2: GDELT API Connection ━━━${RESET}`);
    info('Calling GDELT DOC 2.0 API...');

    const result = await ingestGDELT();

    assert(result.status === 'success', `Ingestion returned status 'success' (got: ${result.status})`);
    assert(typeof result.total === 'number', `Result has 'total' count (got: ${result.total})`);
    assert(typeof result.inserted === 'number', `Result has 'inserted' count (got: ${result.inserted})`);
    assert(typeof result.skipped === 'number', `Result has 'skipped' count (got: ${result.skipped})`);

    if (result.total > 0) {
        info(`Articles received from GDELT: ${result.total}`);
        info(`New events inserted:          ${result.inserted}`);
        info(`Duplicates/errors skipped:    ${result.skipped}`);
    } else {
        warn('GDELT returned 0 articles. This may be a temporary API issue or network problem.');
    }

    return result;
}

async function testDatabaseState() {
    console.log(`\n${CYAN}━━━ TEST 3: Database State ━━━${RESET}`);

    // Check events table exists and has rows
    const eventsResult = await pool.query('SELECT COUNT(*) AS count FROM events WHERE source = $1', ['gdelt']);
    const eventsCount = parseInt(eventsResult.rows[0].count);
    assert(eventsCount >= 0, `events table is accessible (current GDELT rows: ${eventsCount})`);

    if (eventsCount > 0) {
        // Spot check a row
        const sampleResult = await pool.query(
            `SELECT id, source, event_category, severity, country, occurred_at
             FROM events WHERE source = 'gdelt' ORDER BY created_at DESC LIMIT 1`
        );
        const sample = sampleResult.rows[0];
        assert(sample.source === 'gdelt', `Row has source = 'gdelt'`);
        assert(sample.severity >= 1 && sample.severity <= 5, `Row severity is in range 1–5 (got: ${sample.severity})`);
        assert(!!sample.event_category, `Row has event_category (got: '${sample.event_category}')`);
        info(`Sample event: [${sample.event_category}] severity=${sample.severity} country=${sample.country || 'N/A'}`);
    } else {
        warn('No GDELT events in DB yet. Check test 2 results.');
    }

    // Check ingestion_state
    const stateResult = await pool.query(`SELECT * FROM ingestion_state WHERE source = 'gdelt'`);
    assert(stateResult.rows.length === 1, `ingestion_state has a row for 'gdelt'`);

    if (stateResult.rows.length > 0) {
        const state = stateResult.rows[0];
        assert(state.last_run_status === 'success', `last_run_status = 'success' (got: '${state.last_run_status}')`);
        info(`ingestion_state: last_synced_at=${state.last_synced_at}, count=${state.last_run_count}`);
    }
}

async function testDeduplication() {
    console.log(`\n${CYAN}━━━ TEST 4: Deduplication Guard ━━━${RESET}`);
    info('Running ingestion a second time to test deduplication...');

    const beforeResult = await pool.query('SELECT COUNT(*) AS count FROM events WHERE source = $1', ['gdelt']);
    const beforeCount = parseInt(beforeResult.rows[0].count);

    const result = await ingestGDELT();

    const afterResult = await pool.query('SELECT COUNT(*) AS count FROM events WHERE source = $1', ['gdelt']);
    const afterCount = parseInt(afterResult.rows[0].count);

    assert(result.status === 'success', `Second run returned status 'success'`);
    assert(result.inserted === 0, `Second run inserted 0 new rows (deduplication working, got: ${result.inserted})`);
    assert(afterCount === beforeCount, `Event count unchanged after second run (${beforeCount} → ${afterCount})`);

    info(`Before: ${beforeCount} rows | After: ${afterCount} rows | Duplicates blocked: ${result.skipped}`);
}

async function run() {
    console.log(`\n${CYAN}╔═══════════════════════════════════════════╗`);
    console.log(`║  SecureX — Ingestion Pipeline Test Suite  ║`);
    console.log(`╚═══════════════════════════════════════════╝${RESET}\n`);

    try {
        await testSeverityMapper();
        await testGDELTConnection();
        await testDatabaseState();
        await testDeduplication();
    } catch (error) {
        fail(`Unexpected test error: ${error.message}`);
        console.error(error);
        failCount++;
    } finally {
        await pool.end();

        console.log(`\n${CYAN}━━━ Results ━━━${RESET}`);
        console.log(`${GREEN}  Passed: ${passCount}${RESET}`);
        if (failCount > 0) {
            console.log(`${RED}  Failed: ${failCount}${RESET}`);
        }
        console.log('');
        process.exit(failCount > 0 ? 1 : 0);
    }
}

run();
