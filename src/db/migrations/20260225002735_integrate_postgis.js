exports.up = async function (knex) {
    // 1. Enable PostGIS extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');

    // 2. Add geography column to locations table
    return knex.schema.alterTable('locations', (table) => {
        table.specificType('geom', 'GEOGRAPHY(POINT, 4326)');
    });
};

exports.down = async function (knex) {
    return knex.schema.alterTable('locations', (table) => {
        table.dropColumn('geom');
    });
};
