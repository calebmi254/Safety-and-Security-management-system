const authService = require('./auth.service');
const logger = require('../../utils/logger');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({
            message: 'Registration successful',
            data: result,
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email or organization already exists' });
        }
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({
            message: 'Login successful',
            data: result,
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
};
