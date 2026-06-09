/**
 * One-shot production DB setup for Neon/Supabase (DB already exists).
 * Runs: schema → migrations → seed demo data
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const run = async () => {
    try {
        console.log('Setting up production database...');

        const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✓ Schema applied');

        const updateSql = `
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP WITH TIME ZONE;

            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                request_id INTEGER REFERENCES service_requests(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message_type VARCHAR(20) DEFAULT 'text',
                content TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);

            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title TEXT NOT NULL,
                body TEXT,
                data JSONB DEFAULT '{}',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'mechanics_user_id_key'
                ) THEN
                    ALTER TABLE mechanics ADD CONSTRAINT mechanics_user_id_key UNIQUE (user_id);
                END IF;
            END $$;
        `;
        await pool.query(updateSql);
        console.log('✓ Migrations applied');

        // Seed
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('password123', 10);

        const driverRes = await pool.query(
            `INSERT INTO users (username, email, password_hash, role)
             VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id`,
            ['demo_driver', 'demo@example.com', passwordHash, 'driver']
        );
        if (driverRes.rowCount > 0) console.log('✓ Demo driver created (demo@example.com / password123)');

        const mechanics = [
            ['mechanic_joe', 'joe@example.com', 'Job Auto Works', 'Engine Specialist', '123 Victoria Island', 6.4281, 3.4219],
            ['sam_repairs', 'sam@example.com', 'Dominion Mobile Repairs', 'Tire & Brake Specialist', '45 Lekki Phase 1', 6.4411, 3.4736],
        ];

        for (const [username, email, name, specialty, address, lat, lng] of mechanics) {
            const userRes = await pool.query(
                `INSERT INTO users (username, email, password_hash, role)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id`,
                [username, email, passwordHash, 'mechanic']
            );
            if (userRes.rowCount > 0) {
                await pool.query(
                    `INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng, is_available)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
                    [userRes.rows[0].id, name, specialty, address, 'Lagos', 'Lagos', lat, lng]
                );
                console.log(`✓ Demo mechanic created (${email})`);
            }
        }

        console.log('\nProduction DB ready!');
        console.log('Demo logins — all passwords: password123');
        console.log('  Driver:   demo@example.com');
        console.log('  Mechanic: joe@example.com');
        console.log('  Mechanic: sam@example.com');
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
};

run();
