-- Run this in Neon Dashboard → SQL Editor → paste all → Run
-- Demo password for all users: password123

DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS postgis; EXCEPTION WHEN others THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'driver',
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    reset_token TEXT,
    reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    lat REAL,
    lng REAL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES users(id),
    mechanic_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    driver_lat REAL,
    driver_lng REAL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES service_requests(id),
    driver_id INTEGER REFERENCES users(id),
    mechanic_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

INSERT INTO users (username, email, password_hash, role) VALUES
  ('demo_driver', 'demo@example.com', '$2b$10$gwknUI/J1o6dRfZEUMb1juSULwvh29JH.agwfndprBlmiCVkKim3S', 'driver'),
  ('mechanic_joe', 'joe@example.com', '$2b$10$gwknUI/J1o6dRfZEUMb1juSULwvh29JH.agwfndprBlmiCVkKim3S', 'mechanic'),
  ('sam_repairs', 'sam@example.com', '$2b$10$gwknUI/J1o6dRfZEUMb1juSULwvh29JH.agwfndprBlmiCVkKim3S', 'mechanic')
ON CONFLICT (email) DO NOTHING;

INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng, is_available)
SELECT id, 'Job Auto Works', 'Engine Specialist', '123 Victoria Island', 'Lagos', 'Lagos', 6.4281, 3.4219, TRUE
FROM users WHERE email = 'joe@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng, is_available)
SELECT id, 'Dominion Mobile Repairs', 'Tire & Brake Specialist', '45 Lekki Phase 1', 'Lagos', 'Lagos', 6.4411, 3.4736, TRUE
FROM users WHERE email = 'sam@example.com'
ON CONFLICT (user_id) DO NOTHING;
