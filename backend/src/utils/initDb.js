const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const initDb = async () => {
    try {
        const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Starting Database Initialization...');
        await pool.query(schemaSql);
        console.log('Database Schema Created Successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
};

initDb();
