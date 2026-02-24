const jwt = require('../utils/jwt');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

const tenantMiddleware = (req, res, next) => {
    // Every request must be scoped to an organization
    // This is typically extracted from the JWT payload or a header
    const orgId = req.user?.organization_id || req.headers['x-organization-id'];

    if (!orgId) {
        logger.warn(`Access attempted without organization context: ${req.path}`);
        return res.status(403).json({ error: 'Forbidden: Organization context required' });
    }

    req.organization_id = orgId;
    next();
};

module.exports = {
    authMiddleware,
    tenantMiddleware,
};
