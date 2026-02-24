const { pool } = require('../../config/db');

const getOrganizationById = async (id) => {
    const res = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
    return res.rows[0];
};

const updateOrganization = async (id, name) => {
    const res = await pool.query(
        'UPDATE organizations SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
    );
    return res.rows[0];
};

module.exports = {
    getOrganizationById,
    updateOrganization,
};
