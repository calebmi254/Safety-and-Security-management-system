const { pool } = require('../../config/db');

const logLocation = async ({ userId, organizationId, latitude, longitude, address }) => {
    const res = await pool.query(
        'INSERT INTO locations (user_id, organization_id, latitude, longitude, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, organizationId, latitude, longitude, address]
    );
    return res.rows[0];
};

const getRecentLocations = async (organizationId, limit = 10) => {
    const res = await pool.query(
        'SELECT * FROM locations WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2',
        [organizationId, limit]
    );
    return res.rows;
};

module.exports = {
    logLocation,
    getRecentLocations,
};
