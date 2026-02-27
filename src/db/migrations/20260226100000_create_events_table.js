/**
 * Migration: Create the canonical `events` table
 *
 * This is the single unified store for all ingested intelligence events
 * from external sources (GDELT, ACLED, etc.).
 *
 * DESIGN NOTES:
 * - No organization_id: events are global facts. Relevance to an
 *   organization is computed at query time via PostGIS proximity.
 * - `source` identifies which adapter produced the record.
 * - `external_id` + `source` together form a deduplication key.
 * - `severity` is YOUR system's 1-5 scale, not the source's raw score.
 * - `actors` is JSONB to accommodate different source structures.
 * - `location` uses PostGIS GEOGRAPHY for accurate proximity queries.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('events', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        // --- Source Tracking ---
        table.string('source', 50).notNullable();          // 'gdelt', 'acled'
        table.string('external_id', 255).nullable();        // original ID from source

        // --- Classification ---
        table.string('event_category', 100).nullable();    // 'armed_clash', 'protest', 'violence'
        table.integer('severity').nullable();               // 1 (low) to 5 (critical)
        table.text('description').nullable();

        // --- Participants ---
        table.jsonb('actors').nullable();                   // { actor1: '...', actor2: '...' }

        // --- Geography ---
        // PostGIS geography column (extension enabled in prior migration)
        table.specificType('location', 'GEOGRAPHY(POINT, 4326)').nullable();
        table.string('country', 100).nullable();

        // --- Timing ---
        table.timestamp('occurred_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Composite unique index to enforce deduplication
    await knex.raw(
        'CREATE UNIQUE INDEX IF NOT EXISTS events_source_external_id_idx ON events (source, external_id) WHERE external_id IS NOT NULL'
    );

    // Index on occurred_at for time-range queries
    await knex.raw(
        'CREATE INDEX IF NOT EXISTS events_occurred_at_idx ON events (occurred_at DESC)'
    );

    // Spatial index for proximity queries
    await knex.raw(
        'CREATE INDEX IF NOT EXISTS events_location_idx ON events USING GIST (location)'
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('events');
};
