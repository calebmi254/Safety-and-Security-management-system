/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1. Add new columns
    await knex.schema.alterTable('users', table => {
        table.string('first_name', 100);
        table.string('last_name', 100);
    });

    // 2. Transfer data (Split 'name' by space)
    const users = await knex('users').select('id', 'name');
    for (const user of users) {
        const parts = user.name.split(' ');
        const firstName = parts[0] || 'User';
        const lastName = parts.slice(1).join(' ') || 'Name';
        await knex('users').where('id', user.id).update({
            first_name: firstName,
            last_name: lastName
        });
    }

    // 3. Make columns not nullable and drop old name column
    await knex.schema.alterTable('users', table => {
        table.string('first_name', 100).notNullable().alter();
        table.string('last_name', 100).notNullable().alter();
        table.dropColumn('name');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('users', table => {
        table.string('name', 255);
    });

    const users = await knex('users').select('id', 'first_name', 'last_name');
    for (const user of users) {
        await knex('users').where('id', user.id).update({
            name: `${user.first_name} ${user.last_name}`.trim()
        });
    }

    await knex.schema.alterTable('users', table => {
        table.string('name', 255).notNullable().alter();
        table.dropColumn('first_name');
        table.dropColumn('last_name');
    });
};
