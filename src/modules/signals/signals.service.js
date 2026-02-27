/**
 * Signals Service
 * 
 * Handles database logic for news signals.
 */

const { pool } = require('../../config/db');

/**
 * Returns the most recent media signals for public overview.
 * @param {number} limit 
 * @param {number} offset
 * @returns {Promise<Array>}
 */
const getLatestSignals = async (limit = 20, offset = 0) => {
    const result = await pool.query(
        `SELECT id, source, title, url, tone, country, language, occurred_at 
         FROM media_signals 
         ORDER BY occurred_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return result.rows;
};

module.exports = {
    getLatestSignals,
};
