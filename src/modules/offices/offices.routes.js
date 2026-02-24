const express = require('express');
const router = express.Router();
const officeController = require('./offices.controller');
const { createOfficeSchema, updateOfficeSchema } = require('./offices.schema');
const validate = require('../../middleware/validate.middleware');
const { authMiddleware, tenantMiddleware } = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

// All office routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Publicly accessible within organization
router.get('/', officeController.getOffices);
router.get('/:id', officeController.getOfficeById);

// Admin only actions
router.post('/',
    authorize('admin'),
    validate(createOfficeSchema),
    officeController.createOffice
);

router.put('/:id',
    authorize('admin'),
    validate(updateOfficeSchema),
    officeController.updateOffice
);

router.delete('/:id', authorize('admin'), officeController.deleteOffice);

module.exports = router;
