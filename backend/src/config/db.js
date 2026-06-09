const { Pool } = require('pg');
require('dotenv').config();

const isCloudDb = Boolean(process.env.DATABASE_URL);

// Strip sslmode from URL — pg v8 treats require as verify-full which can cause ECONNRESET on some networks
const getConnectionString = () => {
    if (!process.env.DATABASE_URL) return null;
    const url = new URL(process.env.DATABASE_URL);
    url.searchParams.delete('sslmode');
    if (!url.searchParams.has('uselibpqcompat')) {
        url.searchParams.set('uselibpqcompat', 'true');
    }
    return url.toString();
};

const poolConfig = isCloudDb
    ? {
        connectionString: getConnectionString(),
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 60000,
        max: 5,
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: false,
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
