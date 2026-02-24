/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('offices', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

        table.string('office_name').notNullable();
        table.string('office_code');
        table.string('office_type'); // HQ, Branch, Warehouse, etc.

        table.string('country').notNullable();
        table.string('state');
        table.string('city').notNullable();
        table.text('physical_address');
        table.string('postal_code');

        table.double('latitude');
        table.double('longitude');

        table.string('timezone');
        table.uuid('branch_manager_id').references('id').inTable('users');

        table.string('phone');
        table.string('email');

        table.boolean('is_active').defaultTo(true);

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.raw('CREATE INDEX idx_offices_org ON offices(organization_id);');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('offices');
};
