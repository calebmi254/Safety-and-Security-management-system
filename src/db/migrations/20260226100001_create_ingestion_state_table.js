/**
 * Migration: Create the `ingestion_state` table
 *
 * This is the watermark/checkpoint store. One row per data source.
 * The scheduler reads `last_synced_at` to determine what data is new,
 * and writes to it after each successful ingestion run.
 *
 * Without this table, every scheduler run would re-fetch and try to
 * insert data already present, relying entirely on the deduplication
 * index rather than being smart about what to fetch.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('ingestion_state', (table) => {
        table.string('source', 50).primary();    // e.g. 'gdelt', 'acled'
        table.timestamp('last_synced_at').nullable();
        table.integer('last_run_count').defaultTo(0);       // how many records were ingested last run
        table.text('last_run_status').defaultTo('pending'); // 'success', 'error', 'pending'
        table.text('last_error').nullable();                // error message if last run failed
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Pre-seed rows for each known source so the manager can always
    // UPDATE rather than needing to INSERT-or-UPDATE logic
    await knex('ingestion_state').insert([
        { source: 'gdelt', last_run_status: 'pending' },
        { source: 'acled', last_run_status: 'pending' },
    ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('ingestion_state');
};
