const express = require('express');
const router = express.Router();
const riskController = require('./risk.controller');
const { authMiddleware, tenantMiddleware } = require('../../middleware/auth.middleware');

router.use(authMiddleware, tenantMiddleware);

router.post('/', riskController.createRisk);
router.get('/', riskController.getRisks);
router.patch('/:id/status', riskController.updateRisk);

module.exports = router;
