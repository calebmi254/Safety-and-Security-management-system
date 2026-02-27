/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('events', table => {
        table.decimal('intensity', 4, 1).nullable(); // Goldstein Scale: -10.0 to 10.0
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('events', table => {
        table.dropColumn('intensity');
    });
};
