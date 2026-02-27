/**
 * Migration: Cleanse `events` table of non-structured data
 * 
 * In the prototype phase, news articles from GDELT DOC were stored in the 
 * `events` table. This migration removes them to ensure the `events` table
 * is reserved for high-precision GDELT 2.1 and ACLED structured data.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Delete all records where source is 'gdelt' (these were the DOC API articles)
    // NOTE: GDELT 2.1 will use 'gdelt_event' as source going forward.
    await knex('events').where('source', 'gdelt').del();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // No rolling back deletes easily, but we can't restore external data this way.
    // In a real environment, we'd have backups.
};
