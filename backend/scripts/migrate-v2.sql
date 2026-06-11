-- Mekanik Nearby v2 migration — run after neon-bootstrap.sql or via npm run update-db
-- Adds: terms, verification, bookings, broadcast SOS, push tokens, reports/blocks, service catalog, PostGIS location

DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS postgis; EXCEPTION WHEN others THEN NULL; END $$;

-- Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_info JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Mechanics — proper KYC fields
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS certification TEXT;
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS workshop_photo_url TEXT;
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS verification_note TEXT;
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

CREATE INDEX IF NOT EXISTS idx_mechanics_location ON mechanics USING GIST (location);

-- Populate PostGIS location from lat/lng where missing
UPDATE mechanics
SET location = ST_SetSRID(ST_Point(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;

-- Service requests — broadcast SOS support
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT FALSE;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS broadcast_radius_m INTEGER DEFAULT 50000;
ALTER TABLE service_requests ALTER COLUMN mechanic_id DROP NOT NULL;

-- Bookings (scheduled, non-emergency)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mechanic_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    notes TEXT,
    address TEXT,
    lat REAL,
    lng REAL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_driver ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mechanic ON bookings(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_at);

-- Push notification tokens (Expo / FCM)
CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'expo',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- Trust & safety
CREATE TABLE IF NOT EXISTS user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Service catalog (pricing info — no payment processing)
CREATE TABLE IF NOT EXISTS service_catalog (
    id SERIAL PRIMARY KEY,
    mechanic_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_ngn INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_mechanic ON service_catalog(mechanic_user_id);

-- Admin seed (optional — set ADMIN_EMAIL in env to promote on boot)
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
