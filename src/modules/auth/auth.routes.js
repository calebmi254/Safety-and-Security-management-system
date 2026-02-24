const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const validate = require('../../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('./auth.schema');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
