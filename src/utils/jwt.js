const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    signToken,
    verifyToken,
};
