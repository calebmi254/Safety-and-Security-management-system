/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('users', table => {
        // Branch/Office scoping
        table.uuid('office_id').references('id').inTable('offices').onDelete('SET NULL');

        // RBAC & Identity Status
        // Note: 'role' already exists from initial schema, so we just alter it if needed
        table.string('role', 50).notNullable().defaultTo('employee').alter();
        table.boolean('must_change_password').defaultTo(true);
        table.boolean('is_active').defaultTo(true);

        // Audit context
        table.uuid('created_by').references('id').inTable('users');

        // Indices for performance
        table.index('organization_id', 'idx_users_org');
        table.index('office_id', 'idx_users_office');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('users', table => {
        table.dropIndex([], 'idx_users_org');
        table.dropIndex([], 'idx_users_office');
        table.dropColumn('created_by');
        table.dropColumn('is_active');
        table.dropColumn('must_change_password');
        // Restore role to its original default
        table.string('role').defaultTo('user').alter();
        table.dropColumn('office_id');
    });
};
