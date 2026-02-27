/**
 * Ingestion Scheduler
 *
 * Manages the timing of automated intelligence ingestion.
 * Uses node-cron to trigger the ingestion manager on a fixed interval.
 *
 * SCHEDULE: Every 60 minutes (conservative to avoid GDELT throttling).
 * When upgraded to GDELTv2 15-min exports, this can be tightened to 15 min.
 *
 * Also exports `runNow()` for on-demand triggering via the API or test scripts.
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { runIngestion } = require('./ingestion.manager');

/**
 * Initialises the cron schedule for automated ingestion.
 * Call this once during server startup.
 */
const initSchedules = () => {
    logger.info('[Scheduler] Initialising ingestion schedules...');

    // Run at minute 0 of every hour — '0 * * * *'
    cron.schedule('0 * * * *', async () => {
        logger.info('[Scheduler] Hourly ingestion tick fired.');
        try {
            const results = await runIngestion();
            logger.info('[Scheduler] Ingestion cycle complete.', { results });
        } catch (err) {
            logger.error(`[Scheduler] Unhandled error in ingestion cycle: ${err.message}`);
        }
    });

    logger.info('[Scheduler] Ingestion scheduled: every 60 minutes.');
};

/**
 * Manually trigger an immediate ingestion run outside of the cron schedule.
 * Used by: POST /api/events/ingest/trigger and test scripts.
 *
 * @returns {Promise<Object>} ingestion results summary
 */
const runNow = async () => {
    logger.info('[Scheduler] Manual ingestion trigger invoked.');
    return runIngestion();
};

module.exports = {
    initSchedules,
    runNow,
};
