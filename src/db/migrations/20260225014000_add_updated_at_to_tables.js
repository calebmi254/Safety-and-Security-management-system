/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('organizations', table => {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable('users', table => {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable('locations', table => {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable('risks', table => {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('risks', table => {
        table.dropColumn('updated_at');
    });

    await knex.schema.alterTable('locations', table => {
        table.dropColumn('updated_at');
    });

    await knex.schema.alterTable('users', table => {
        table.dropColumn('updated_at');
    });

    await knex.schema.alterTable('organizations', table => {
        table.dropColumn('updated_at');
    });
};
