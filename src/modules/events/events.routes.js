/**
 * Events Routes
 *
 * All routes require authentication (authMiddleware + tenantMiddleware)
 * following the same pattern as risks.routes.js.
 */

const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');
const { authMiddleware, tenantMiddleware } = require('../../middleware/auth.middleware');

// All routes require a valid JWT and tenant context
router.use(authMiddleware, tenantMiddleware);

// GET /api/events — returns events near org's locations
router.get('/', eventsController.getEvents);

// GET /api/events/status — ingestion pipeline health
router.get('/status', eventsController.getIngestionStatus);

// POST /api/events/ingest/trigger — manual ingestion trigger
router.post('/ingest/trigger', eventsController.triggerIngestion);

module.exports = router;
