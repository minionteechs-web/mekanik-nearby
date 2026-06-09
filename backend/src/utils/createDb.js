const { Client } = require('pg');
require('dotenv').config();

const createDb = async () => {
    // Connect to the default 'postgres' database first
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        database: 'postgres' // Connect to default
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL (default database)');

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [process.env.DB_NAME]);

        if (res.rowCount === 0) {
            console.log(`Database "${process.env.DB_NAME}" does not exist. Creating...`);
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log(`Database "${process.env.DB_NAME}" created successfully.`);
        } else {
            console.log(`Database "${process.env.DB_NAME}" already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
};

createDb();
