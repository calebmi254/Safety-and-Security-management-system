const pool = require('../../config/db');
const logger = require('../../utils/logger');

const getOffices = async (organizationId) => {
    const res = await pool.query(
        'SELECT * FROM offices WHERE organization_id = $1 ORDER BY created_at DESC',
        [organizationId]
    );
    return res.rows;
};

const getOfficeById = async (id, organizationId) => {
    const res = await pool.query(
        'SELECT * FROM offices WHERE id = $1 AND organization_id = $2',
        [id, organizationId]
    );
    return res.rows[0];
};

const createOffice = async (organizationId, officeData) => {
    const {
        office_name, office_code, office_type, country, state, city,
        physical_address, postal_code, latitude, longitude,
        timezone, branch_manager_id, phone, email
    } = officeData;

    const res = await pool.query(
        `INSERT INTO offices (
            organization_id, office_name, office_code, office_type,
            country, state, city, physical_address, postal_code,
            latitude, longitude, timezone, branch_manager_id,
            phone, email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
            organizationId, office_name, office_code, office_type,
            country, state, city, physical_address, postal_code,
            latitude, longitude, timezone, branch_manager_id,
            phone, email
        ]
    );
    return res.rows[0];
};

const updateOffice = async (id, organizationId, officeData) => {
    const fields = Object.keys(officeData);
    if (fields.length === 0) return null;

    const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = fields.map(field => officeData[field]);

    const res = await pool.query(
        `UPDATE offices SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND organization_id = $2
         RETURNING *`,
        [id, organizationId, ...values]
    );
    return res.rows[0];
};

const deleteOffice = async (id, organizationId) => {
    const res = await pool.query(
        'DELETE FROM offices WHERE id = $1 AND organization_id = $2 RETURNING id',
        [id, organizationId]
    );
    return res.rowCount > 0;
};

module.exports = {
    getOffices,
    getOfficeById,
    createOffice,
    updateOffice,
    deleteOffice
};
