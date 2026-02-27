/**
 * Public Routes
 * 
 * Accessible without authentication for the landing page overview.
 */

const express = require('express');
const router = express.Router();
const signalsController = require('./signals/signals.controller');
const eventsService = require('./events/events.service');

// GET /api/public/signals - Latest news signals
router.get('/signals', signalsController.getLatestSignals);

// GET /api/public/events - Latest structured events (unfiltered by org)
router.get('/events', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        // Re-using event service but with broad query
        const result = await require('../config/db').pool.query(
            `SELECT id, source, event_category, severity, intensity, title, description, actors, ST_AsText(location::geometry) as geo, country, source_url, occurred_at 
             FROM events 
             WHERE title IS NOT NULL
             ORDER BY occurred_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        return res.status(200).json({
            data: result.rows,
            meta: {
                count: result.rows.length,
                limit,
                offset
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
