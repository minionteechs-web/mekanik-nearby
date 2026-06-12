require('dotenv').config();

const isCloudDb = Boolean(process.env.DATABASE_URL);

let pool;

if (isCloudDb) {
    // Neon over WebSockets — works when direct TCP/5432 is blocked on the network
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const ws = require('ws');

    neonConfig.webSocketConstructor = ws;

    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: 30000,
    });

    console.log('Database: Neon (WebSocket transport)');
} else {
    const { Pool } = require('pg');

    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: false,
        max: 5,
    });

    console.log(`Database: local PostgreSQL (${process.env.DB_HOST || 'localhost'})`);
}

pool.on('connect', () => {
    console.log('PostgreSQL pool connected');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
