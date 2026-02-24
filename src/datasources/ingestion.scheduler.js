const logger = require('../utils/logger');
const { ingestExternalData } = require('./ingestion.service');

/**
 * Ingestion Scheduler
 * Periodically triggers data ingestion tasks.
 */
const initSchedules = () => {
    logger.info('Initializing data ingestion schedules...');

    // Future: Use node-cron or similar to trigger ingestion
    // Example: 
    // cron.schedule('*/30 * * * *', () => ingestExternalData('news-api'));
};

module.exports = {
    initSchedules,
};
