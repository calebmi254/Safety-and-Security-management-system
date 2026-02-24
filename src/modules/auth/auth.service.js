const { pool } = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const logger = require('../../utils/logger');

const register = async ({ firstName, lastName, email, password, organizationName }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Organization
        const orgSlug = organizationName.toLowerCase().replace(/ /g, '-');
        const orgRes = await client.query(
            'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
            [organizationName, orgSlug]
        );
        const organizationId = orgRes.rows[0].id;

        // 2. Create User as Admin
        const hashedPassword = await hashPassword(password);
        const userRes = await client.query(
            'INSERT INTO users (organization_id, first_name, last_name, email, password_hash, role, must_change_password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [organizationId, firstName, lastName, email, hashedPassword, 'admin', false]
        );

        await client.query('COMMIT');

        return {
            userId: userRes.rows[0].id,
            organizationId,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Registration failed:', error);
        throw error;
    } finally {
        client.release();
    }
};

const login = async ({ email, password }) => {
    const res = await pool.query(
        'SELECT id, first_name, last_name, organization_id, password_hash, role, must_change_password FROM users WHERE email = $1',
        [email]
    );

    const user = res.rows[0];
    if (!user) throw new Error('Invalid credentials');

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials');

    const token = signToken({
        id: user.id,
        organization_id: user.organization_id,
        role: user.role,
    });

    return {
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            mustChangePassword: user.must_change_password,
        },
        token,
    };
};

const changePassword = async (userId, newPassword) => {
    const hashedPassword = await hashPassword(newPassword);
    await pool.query(
        'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
    );
    return true;
};

module.exports = {
    register,
    login,
    changePassword,
};
