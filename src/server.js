const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initSchedules } = require('./datasources/ingestion.scheduler');

const startServer = () => {
    try {
        app.listen(env.PORT, () => {
            logger.info(`🚀 SecureX Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);

            // Start the intelligence ingestion scheduler
            initSchedules();
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
