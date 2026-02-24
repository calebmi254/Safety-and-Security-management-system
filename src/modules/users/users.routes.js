const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const { authMiddleware, tenantMiddleware } = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const { createUserSchema, updateUserSchema } = require('./users.schema');

router.use(authMiddleware, tenantMiddleware);

// Admin/Manager can list users
router.get('/', authorize('admin', 'manager'), userController.getUsers);
router.get('/:id', authorize('admin', 'manager'), userController.getUserById);

// Only Admin can create employees
router.post('/', authorize('admin'), validate(createUserSchema), userController.createUser);

// Admin/Manager can update (managers only within their org scope, enforced in service)
router.put('/:id', authorize('admin', 'manager'), validate(updateUserSchema), userController.updateUser);

// Only Admin can toggle status
router.patch('/:id/status', authorize('admin'), userController.toggleStatus);

module.exports = router;
