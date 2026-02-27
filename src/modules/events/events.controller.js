/**
 * Events Controller
 *
 * Handles HTTP requests for the events module.
 * Delegates all data logic to events.service.js.
 */

const eventsService = require('./events.service');
const { runNow } = require('../../datasources/ingestion.scheduler');
const logger = require('../../utils/logger');

/**
 * GET /api/events
 *
 * Returns intelligence events relevant to the requesting organization.
 * Uses PostGIS proximity filtering against the org's saved locations.
 *
 * Query params:
 *   radius (optional) — radius in km, default 100
 *   limit  (optional) — max results, default 50
 */
const getEvents = async (req, res, next) => {
    try {
        const radius = parseInt(req.query.radius) || 100;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Cap at 200

        const events = await eventsService.getEventsForOrganization(
            req.organization_id,
            radius,
            limit
        );

        return res.status(200).json({
            data: events,
            meta: {
                count: events.length,
                radius_km: radius,
                organization_id: req.organization_id,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/events/status
 *
 * Returns the ingestion pipeline status for all sources.
 * Useful for a dashboard health/status panel.
 */
const getIngestionStatus = async (req, res, next) => {
    try {
        const status = await eventsService.getIngestionStatus();
        return res.status(200).json({ data: status });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/events/ingest/trigger
 *
 * Manually triggers an immediate ingestion run.
 * Responds immediately with 202 Accepted and runs ingestion async.
 *
 * This is intentionally NOT awaited so the HTTP response returns fast.
 * The caller should check /api/events/status afterwards to see results.
 */
const triggerIngestion = async (req, res, next) => {
    try {
        logger.info(`[Events API] Manual ingestion trigger by user: ${req.user_id}`);

        // Fire and forget — respond immediately, run async
        runNow().then(results => {
            logger.info('[Events API] Manual ingestion complete.', { results });
        }).catch(err => {
            logger.error(`[Events API] Manual ingestion error: ${err.message}`);
        });

        return res.status(202).json({
            message: 'Ingestion triggered. Check /api/events/status for results.',
            status: 'accepted',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEvents,
    getIngestionStatus,
    triggerIngestion,
};
