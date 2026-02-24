const logger = require('../utils/logger');
const env = require('../config/env');

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const isProduction = env.NODE_ENV === 'production';

    logger.error({
        message: err.message,
        stack: isProduction ? undefined : err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(statusCode).json({
        error: {
            message: statusCode === 500 && isProduction ? 'Internal Server Error' : err.message,
            ...(isProduction ? {} : { stack: err.stack }),
        },
    });
};

module.exports = errorMiddleware;
