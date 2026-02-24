const { pool } = require('../../config/db');

const createRisk = async ({ organizationId, title, description, riskLevel }) => {
    const res = await pool.query(
        'INSERT INTO risks (organization_id, title, description, risk_level) VALUES ($1, $2, $3, $4) RETURNING *',
        [organizationId, title, description, riskLevel]
    );
    return res.rows[0];
};

const getRisks = async (organizationId) => {
    const res = await pool.query(
        'SELECT * FROM risks WHERE organization_id = $1 ORDER BY created_at DESC',
        [organizationId]
    );
    return res.rows;
};

const updateRiskStatus = async (id, organizationId, status) => {
    const res = await pool.query(
        'UPDATE risks SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *',
        [status, id, organizationId]
    );
    return res.rows[0];
};

module.exports = {
    createRisk,
    getRisks,
    updateRiskStatus,
};
