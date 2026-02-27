/**
 * Ingestion Manager (Orchestrator)
 *
 * Ingestion Manager — Orchestrates all data source adapters
 * 
 * This manager is the central entry point for the ingestion pipeline.
 * It isolates errors from individual sources ensuring that 
 * a failure in one adapter doesn't stop the entire process.
 */

const logger = require('../utils/logger');
const gdeltSignals = require('./sources/gdelt_doc.signals');
const gdeltEvents = require('./sources/gdelt_events.source');

/**
 * Runs all configured ingestion adapters in sequence.
 * Results from each are collected and returned as a summary.
 *
 * @returns {Object} summary of results per source
 */
async function runIngestion() {
    logger.info('[Ingestion] Starting global ingestion run...');

    const results = {};

    // 1. GDELT DOC Signals (Early Warning - News)
    try {
        results.gdelt_doc = await gdeltSignals.ingestSignals();
    } catch (error) {
        logger.error(`[Ingestion] GDELT_DOC adapter failed: ${error.message}`);
        results.gdelt_doc = { status: 'error', error: error.message };
    }

    // 2. GDELT 2.1 Structured Events (Incident Data)
    try {
        results.gdelt_event = await gdeltEvents.ingestEvents();
    } catch (error) {
        logger.error(`[Ingestion] GDELT_EVENT adapter failed: ${error.message}`);
        results.gdelt_event = { status: 'error', error: error.message };
    }

    // --- ACLED (Phase 2 — stub) ---
    // When acled.source.js is built, add:
    // try {
    //     results.acled = await ingestACLED();
    // } catch (err) {
    //     logger.error(`[IngestionManager] ACLED adapter threw uncaught error: ${err.message}`);
    //     results.acled = { status: 'error', error: err.message };
    // }

    logger.info('[IngestionManager] Ingestion cycle complete.', { results });
    return results;
};

module.exports = {
    runIngestion,
    // Keep old export for any existing code that may import it
    ingestExternalData: runIngestion,
};
