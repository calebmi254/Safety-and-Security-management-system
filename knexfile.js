const env = require('./src/config/env');

module.exports = {
    development: {
        client: 'pg',
        connection: env.DATABASE_URL,
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
    production: {
        client: 'pg',
        connection: env.DATABASE_URL,
        migrations: {
            directory: './src/db/migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
};
