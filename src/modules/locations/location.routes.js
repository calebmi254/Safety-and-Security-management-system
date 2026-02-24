const express = require('express');
const router = express.Router();
const locationController = require('./location.controller');
const { authMiddleware, tenantMiddleware } = require('../../middleware/auth.middleware');

router.post('/', authMiddleware, tenantMiddleware, locationController.logLocation);
router.get('/', authMiddleware, tenantMiddleware, locationController.getLocations);

module.exports = router;
