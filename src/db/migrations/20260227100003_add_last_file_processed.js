/**
 * Migration: Add last_file_processed to ingestion_state
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('ingestion_state', (table) => {
        table.string('last_file_processed', 255).nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('ingestion_state', (table) => {
        table.dropColumn('last_file_processed');
    });
};
