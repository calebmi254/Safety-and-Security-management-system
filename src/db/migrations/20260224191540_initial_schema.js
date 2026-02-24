/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('organizations', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.string('name').notNullable();
            table.string('slug').unique().notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('users', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
            table.string('name').notNullable();
            table.string('email').unique().notNullable();
            table.string('password_hash').notNullable();
            table.string('role').defaultTo('user'); // admin, user
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('locations', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
            table.decimal('latitude', 10, 8).notNullable();
            table.decimal('longitude', 11, 8).notNullable();
            table.string('address').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('risks', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
            table.string('title').notNullable();
            table.text('description').nullable();
            table.string('risk_level').notNullable(); // low, medium, high, critical
            table.string('status').defaultTo('open'); // open, mitigated, closed
            table.timestamp('created_at').defaultTo(knex.fn.now());
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('risks')
        .dropTableIfExists('locations')
        .dropTableIfExists('users')
        .dropTableIfExists('organizations');
};
