/**
 * Migration: Add gdelt_event row to ingestion_state
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex('ingestion_state').insert([
        { source: 'gdelt_event', last_run_status: 'pending' }
    ]).onConflict('source').ignore();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex('ingestion_state').where('source', 'gdelt_event').del();
};
