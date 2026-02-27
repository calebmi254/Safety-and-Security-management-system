/**
 * Migration: Create the `media_signals` table
 * 
 * This table stores news-based intelligence signals (like GDELT DOC).
 * These are "mentions" or "reports" rather than verified structured events.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('media_signals', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        table.string('source', 50).notNullable();          // 'GDELT_DOC'
        table.string('external_id', 255).notNullable();     // The URL or news ID

        table.string('title', 500).nullable();
        table.text('url').nullable();
        table.float('tone').nullable();                    // Sentiment/Tone score

        table.string('country', 100).nullable();
        table.string('language', 50).nullable();

        table.timestamp('occurred_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Enforce uniqueness per source and external_id
        table.unique(['source', 'external_id']);
    });

    // Create index for fast lookups by country and date
    await knex.raw('CREATE INDEX idx_media_signals_country_date ON media_signals (country, occurred_at DESC)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('media_signals');
};
