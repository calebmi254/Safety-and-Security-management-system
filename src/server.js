const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const startServer = () => {
    try {
        app.listen(env.PORT, () => {
            logger.info(`🚀 SecureX Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
