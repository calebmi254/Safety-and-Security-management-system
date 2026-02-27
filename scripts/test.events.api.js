/**
 * Test Script: Events API Endpoints
 *
 * Tests all three /api/events endpoints via HTTP.
 * Requires the SecureX server to be running.
 *
 * Run from the project root (with server already running):
 *
 *   Terminal 1:  npm run dev
 *   Terminal 2:  node scripts/test.events.api.js
 *
 * What this tests:
 *   1. Unauthenticated GET /api/events → 401 (auth guard works)
 *   2. Authenticated GET /api/events  → 200 with data array
 *   3. GET /api/events/status         → 200 with ingestion_state info
 *   4. POST /api/events/ingest/trigger → 202 Accepted
 *   5. Response shape validation      → all required fields present
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;

// ANSI colours
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
let authToken = null;

function assert(condition, message) {
    if (condition) { pass(message); passCount++; }
    else { fail(message); failCount++; }
}

// --- Step 1: Login to get a token ---

async function login() {
    console.log(`\n${CYAN}━━━ Setup: Authenticating ━━━${RESET}`);
    info('Attempting login to get JWT token...');

    // You should have at least one user registered from the test_registration.js script.
    // If credentials below don't match, update them to any valid admin/user in your DB.
    const credentials = {
        email: process.env.TEST_USER_EMAIL || 'admin@testsecurex.com',
        password: process.env.TEST_USER_PASSWORD || 'password123',
    };

    try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        authToken = response.data?.data?.token;

        if (authToken) {
            pass(`Login successful — got JWT token`);
            info(`User: ${credentials.email}`);
        } else {
            fail('Login response did not include a token. Test cannot continue.');
            warn(`Set TEST_USER_EMAIL and TEST_USER_PASSWORD in your .env if credentials differ.`);
            return false;
        }
        return true;
    } catch (error) {
        fail(`Login failed (${error.response?.status || 'network error'}): ${error.response?.data?.message || error.message}`);
        warn('Make sure the server is running (npm run dev) and test user credentials are correct.');
        warn(`Set TEST_USER_EMAIL=<email> TEST_USER_PASSWORD=<password> in .env to override defaults.`);
        return false;
    }
}

// --- Test: Unauthenticated request ---

async function testUnauthenticatedAccess() {
    console.log(`\n${CYAN}━━━ TEST 1: Auth Guard ━━━${RESET}`);

    try {
        await axios.get(`${API_URL}/events`);
        fail('Unauthenticated GET /api/events should have returned 401');
        failCount++;
    } catch (error) {
        const status = error.response?.status;
        assert(status === 401, `Unauthenticated GET /api/events → 401 (got: ${status})`);
    }
}

// --- Test: Get events ---

async function testGetEvents() {
    console.log(`\n${CYAN}━━━ TEST 2: GET /api/events ━━━${RESET}`);

    try {
        const response = await axios.get(`${API_URL}/events`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { radius: 500, limit: 10 },
        });

        assert(response.status === 200, `Status 200 (got: ${response.status})`);
        assert(Array.isArray(response.data.data), `Response body has data array`);
        assert(typeof response.data.meta === 'object', `Response body has meta object`);
        assert(typeof response.data.meta.count === 'number', `meta.count is a number`);

        const events = response.data.data;
        info(`Events returned: ${events.length}`);

        if (events.length > 0) {
            const e = events[0];
            assert('source' in e, `Event has 'source' field (got: '${e.source}')`);
            assert('severity' in e, `Event has 'severity' field (got: ${e.severity})`);
            assert('event_category' in e, `Event has 'event_category' field`);
            assert('occurred_at' in e, `Event has 'occurred_at' field`);
            info(`Sample event: [${e.event_category}] severity=${e.severity}, source=${e.source}`);
        } else {
            warn('No events returned. Try running: node scripts/test.ingestion.js first to populate data.');
        }

    } catch (error) {
        fail(`GET /api/events failed: ${error.response?.status} — ${error.response?.data?.message || error.message}`);
        failCount++;
    }
}

// --- Test: Ingestion status ---

async function testIngestionStatus() {
    console.log(`\n${CYAN}━━━ TEST 3: GET /api/events/status ━━━${RESET}`);

    try {
        const response = await axios.get(`${API_URL}/events/status`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        assert(response.status === 200, `Status 200 (got: ${response.status})`);
        assert(Array.isArray(response.data.data), `Response has data array`);

        const statuses = response.data.data;
        const gdeltRow = statuses.find(s => s.source === 'gdelt');
        assert(!!gdeltRow, `ingestion_state row found for source 'gdelt'`);

        if (gdeltRow) {
            assert('last_run_status' in gdeltRow, `Row has 'last_run_status' (got: '${gdeltRow.last_run_status}')`);
            info(`GDELT status: ${gdeltRow.last_run_status}, last synced: ${gdeltRow.last_synced_at || 'never'}`);
        }

    } catch (error) {
        fail(`GET /api/events/status failed: ${error.response?.status} — ${error.message}`);
        failCount++;
    }
}

// --- Test: Manual trigger ---

async function testManualTrigger() {
    console.log(`\n${CYAN}━━━ TEST 4: POST /api/events/ingest/trigger ━━━${RESET}`);

    try {
        const response = await axios.post(`${API_URL}/events/ingest/trigger`, {}, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        assert(response.status === 202, `Status 202 Accepted (got: ${response.status})`);
        assert(response.data.status === 'accepted', `Response body status = 'accepted'`);
        assert(typeof response.data.message === 'string', `Response has a message string`);
        info(`Response: ${response.data.message}`);

    } catch (error) {
        fail(`POST /api/events/ingest/trigger failed: ${error.response?.status} — ${error.message}`);
        failCount++;
    }
}

// --- Runner ---

async function run() {
    console.log(`\n${CYAN}╔══════════════════════════════════════════╗`);
    console.log(`║  SecureX — Events API Test Suite          ║`);
    console.log(`╚══════════════════════════════════════════╝${RESET}\n`);

    // Check server is reachable
    try {
        await axios.get(`${API_URL.replace('/api', '')}/health`);
        info('Server is reachable ✓');
    } catch {
        fail('Server is not reachable. Make sure "npm run dev" is running before running this test.');
        console.log('');
        process.exit(1);
    }

    const loggedIn = await login();
    if (!loggedIn) {
        console.log(`\n${RED}Cannot proceed without authentication. Exiting.${RESET}\n`);
        process.exit(1);
    }

    await testUnauthenticatedAccess();
    await testGetEvents();
    await testIngestionStatus();
    await testManualTrigger();

    console.log(`\n${CYAN}━━━ Results ━━━${RESET}`);
    console.log(`${GREEN}  Passed: ${passCount}${RESET}`);
    if (failCount > 0) {
        console.log(`${RED}  Failed: ${failCount}${RESET}`);
    }
    console.log('');
    process.exit(failCount > 0 ? 1 : 0);
}

run();
