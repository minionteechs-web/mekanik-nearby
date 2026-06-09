-- Run in Neon SQL Editor if users table already exists without avatar_url
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
