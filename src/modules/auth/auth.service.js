const { pool } = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const logger = require('../../utils/logger');

const register = async ({ name, email, password, organizationName }) => {
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
            'INSERT INTO users (organization_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [organizationId, name, email, hashedPassword, 'admin']
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
        'SELECT id, name, organization_id, password_hash, role FROM users WHERE email = $1',
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
            name: user.name,
            role: user.role,
        },
        token,
    };
};

module.exports = {
    register,
    login,
};
