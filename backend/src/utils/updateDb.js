const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    const sqlPath = path.join(__dirname, '../../scripts/migrate-v2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
};

const updateDb = async () => {
    try {
        const legacy = `
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP WITH TIME ZONE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

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

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'mechanics_user_id_key'
                ) THEN
                    ALTER TABLE mechanics ADD CONSTRAINT mechanics_user_id_key UNIQUE (user_id);
                END IF;
            END $$;

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
        `;

        await db.query(legacy);
        await runMigration();
        console.log('Database updated successfully (v2 migration applied).');
        process.exit(0);
    } catch (err) {
        console.error('Error updating database:', err);
        process.exit(1);
    }
};

updateDb();
