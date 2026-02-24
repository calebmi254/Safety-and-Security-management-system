const { pool } = require('../../config/db');
const { hashPassword } = require('../../utils/password');
const logger = require('../../utils/logger');

const getUsers = async (organizationId) => {
    const res = await pool.query(
        `SELECT id, first_name, last_name, email, role, is_active, office_id, must_change_password, created_at 
         FROM users 
         WHERE organization_id = $1 
         ORDER BY created_at DESC`,
        [organizationId]
    );
    return res.rows;
};

const getUserById = async (id, organizationId) => {
    const res = await pool.query(
        `SELECT id, first_name, last_name, email, role, is_active, office_id, must_change_password, created_at 
         FROM users 
         WHERE id = $1 AND organization_id = $2`,
        [id, organizationId]
    );
    return res.rows[0];
};

const createUser = async (organizationId, creatorId, userData) => {
    const {
        first_name, last_name, email, password, role, office_id
    } = userData;

    const hashedPassword = await hashPassword(password);

    const res = await pool.query(
        `INSERT INTO users (
            organization_id, first_name, last_name, email, password_hash, 
            role, office_id, created_by, must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id, first_name, last_name, email, role, is_active, office_id, created_at`,
        [
            organizationId, first_name, last_name, email, hashedPassword,
            role || 'employee', office_id, creatorId
        ]
    );
    return res.rows[0];
};

const updateUser = async (id, organizationId, userData) => {
    // Filter out fields that shouldn't be updated or don't exist in the DB
    const forbidden = ['id', 'organization_id', 'password', 'password_hash', 'created_at', 'updated_at'];
    const fields = Object.keys(userData).filter(k => !forbidden.includes(k) && userData[k] !== undefined);

    if (fields.length === 0) return null;

    const setClause = fields.map((field, index) => {
        // Map frontend fields if necessary (though they should align now)
        return `"${field}" = $${index + 3}`;
    }).join(', ');

    const values = fields.map(field => userData[field]);

    const res = await pool.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND organization_id = $2
         RETURNING id, first_name, last_name, email, role, is_active, office_id`,
        [id, organizationId, ...values]
    );
    return res.rows[0];
};

const toggleUserStatus = async (id, organizationId, isActive) => {
    const res = await pool.query(
        'UPDATE users SET is_active = $1 WHERE id = $2 AND organization_id = $3 RETURNING id',
        [isActive, id, organizationId]
    );
    return res.rowCount > 0;
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserStatus
};
