/**
 * Signals Controller
 */

const signalsService = require('./signals.service');

const getLatestSignals = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const signals = await signalsService.getLatestSignals(limit, offset);

        return res.status(200).json({
            data: signals,
            meta: {
                count: signals.length,
                limit,
                offset
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLatestSignals,
};
