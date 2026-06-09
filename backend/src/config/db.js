const { Pool } = require('pg');
require('dotenv').config();

const useSsl = process.env.DATABASE_URL || process.env.DB_SSL === 'true';

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    console.log('PostgreSQL Pool Connected');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
