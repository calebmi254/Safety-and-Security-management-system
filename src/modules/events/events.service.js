/**
 * Events Service
 *
 * Handles all database queries for the events module.
 * The primary query uses PostGIS ST_DWithin to return events that are
 * geospatially relevant to the requesting organization's saved locations.
 *
 * If the organization has no saved locations, falls back to returning
 * the most recent events globally (useful for new organizations).
 */

const { pool } = require('../../config/db');

/**
 * Returns events relevant to an organization.
 * "Relevant" = within `radiusKm` kilometers of any of the org's saved locations.
 * Falls back to most recent 50 global events if the org has no locations.
 *
 * @param {string} organizationId - UUID of the requesting organization
 * @param {number} radiusKm - search radius in kilometers (default 100)
 * @param {number} limit - max events to return (default 50)
 * @returns {Promise<Array>} array of event objects
 */
const getEventsForOrganization = async (organizationId, radiusKm = 100, limit = 50) => {
    // First: get the organization's saved locations
    const locationResult = await pool.query(
        `SELECT geom FROM locations WHERE organization_id = $1 AND geom IS NOT NULL LIMIT 10`,
        [organizationId]
    );

    if (locationResult.rows.length === 0) {
        // Fallback: no locations saved — return latest global events
        const result = await pool.query(
            `SELECT
                id,
                source,
                event_category,
                severity,
                intensity,
                title,
                description,
                actors,
                country,
                occurred_at,
                created_at
             FROM events
             ORDER BY occurred_at DESC NULLS LAST
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }

    // Build a proximity query using ST_DWithin against all org locations.
    // ST_DWithin on GEOGRAPHY type measures distance in meters.
    const radiusMeters = radiusKm * 1000;

    // Generate $3, $4, $5... placeholders for each location geometry
    const locationParams = locationResult.rows.map((row, i) => `$${i + 3}`);
    const placeholders = locationParams.join(', ');

    const query = `
        SELECT DISTINCT ON (e.id)
            e.id,
            e.source,
            e.event_category,
            e.severity,
            e.intensity,
            e.title,
            e.description,
            e.actors,
            e.country,
            e.occurred_at,
            e.created_at,
            ROUND(
                MIN(ST_Distance(e.location, l.geom)) / 1000
            )::integer AS distance_km
        FROM events e
        CROSS JOIN (VALUES ${locationParams.map((_, i) => `($${i + 3}::geography)`).join(', ')}) AS l(geom)
        WHERE e.location IS NOT NULL
          AND ST_DWithin(e.location, l.geom, $2)
        GROUP BY e.id, e.source, e.event_category, e.severity,
                 e.description, e.actors, e.country, e.occurred_at, e.created_at
        ORDER BY e.id, e.occurred_at DESC NULLS LAST
        LIMIT $1
    `;

    const locationGeoms = locationResult.rows.map(row => row.geom);

    const result = await pool.query(query, [limit, radiusMeters, ...locationGeoms]);
    return result.rows;
};

/**
 * Returns all events ordered by occurred_at descending.
 * Admin-level view — not filtered by organization.
 *
 * @param {number} limit - max events to return
 * @returns {Promise<Array>} array of event objects
 */
const getAllEvents = async (limit = 100) => {
    const result = await pool.query(
        `SELECT
            id, source, event_category, severity, intensity, title,
            description, actors, country, occurred_at, created_at
         FROM events
         ORDER BY occurred_at DESC NULLS LAST
         LIMIT $1`,
        [limit]
    );
    return result.rows;
};

/**
 * Returns the current ingestion state for all sources.
 * Used by the dashboard status panel.
 *
 * @returns {Promise<Array>} array of ingestion_state rows
 */
const getIngestionStatus = async () => {
    const result = await pool.query(
        `SELECT source, last_synced_at, last_run_count, last_run_status, last_error, updated_at
         FROM ingestion_state
         ORDER BY source`
    );
    return result.rows;
};

module.exports = {
    getEventsForOrganization,
    getAllEvents,
    getIngestionStatus,
};
