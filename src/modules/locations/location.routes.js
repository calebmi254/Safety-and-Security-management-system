const express = require('express');
const router = express.Router();
const locationController = require('./location.controller');
const { authMiddleware, tenantMiddleware } = require('../../middleware/auth.middleware');

router.post('/', authMiddleware, tenantMiddleware, locationController.logLocation);
router.get('/', authMiddleware, tenantMiddleware, locationController.getLocations);
router.get('/search', authMiddleware, locationController.searchLocation);
router.get('/reverse', authMiddleware, locationController.reverseGeocode);

module.exports = router;
