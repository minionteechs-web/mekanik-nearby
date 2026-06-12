/**
 * Neon connection diagnostics — run: node scripts/test-neon.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
    console.error('DATABASE_URL is not set in backend/.env');
    process.exit(1);
}

const parsed = new URL(rawUrl);
console.log('Host:', parsed.hostname);
console.log('Pooler:', parsed.hostname.includes('-pooler'));
console.log('Region hint:', parsed.hostname.match(/\.([a-z]+-[a-z]+-\d+)\./)?.[1] || 'unknown');

const variants = [
    {
        name: 'app default (sslmode stripped + uselibpqcompat)',
        build: () => {
            const u = new URL(rawUrl);
            u.searchParams.delete('sslmode');
            u.searchParams.set('uselibpqcompat', 'true');
            return {
                connectionString: u.toString(),
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 20000,
            };
        },
    },
    {
        name: 'raw DATABASE_URL as-is',
        build: () => ({
            connectionString: rawUrl,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 20000,
        }),
    },
    {
        name: 'sslmode=require in URL',
        build: () => {
            const u = new URL(rawUrl);
            u.searchParams.set('sslmode', 'require');
            return {
                connectionString: u.toString(),
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 20000,
            };
        },
    },
    {
        name: 'explicit ssl object only (no sslmode param)',
        build: () => {
            const u = new URL(rawUrl);
            u.searchParams.delete('sslmode');
            u.searchParams.delete('uselibpqcompat');
            return {
                connectionString: u.toString(),
                ssl: true,
                connectionTimeoutMillis: 20000,
            };
        },
    },
];

const tryConnect = async (label, config) => {
    const pool = new Pool({ ...config, max: 1 });
    const start = Date.now();
    try {
        const res = await pool.query('SELECT version(), current_database(), now() AS ts');
        console.log(`✓ ${label} (${Date.now() - start}ms)`);
        console.log('  db:', res.rows[0].current_database);
        console.log('  time:', res.rows[0].ts);
        await pool.end();
        return true;
    } catch (err) {
        console.log(`✗ ${label} (${Date.now() - start}ms)`);
        console.log('  code:', err.code || 'n/a');
        console.log('  message:', err.message);
        await pool.end().catch(() => {});
        return false;
    }
};

const tryServerless = async () => {
    try {
        const { neon } = require('@neondatabase/serverless');
        const sql = neon(rawUrl);
        const start = Date.now();
        const rows = await sql`SELECT current_database() AS db, now() AS ts`;
        console.log(`✓ @neondatabase/serverless (${Date.now() - start}ms)`);
        console.log('  db:', rows[0].db);
        console.log('  time:', rows[0].ts);
        return true;
    } catch (err) {
        console.log('✗ @neondatabase/serverless');
        console.log('  code:', err.code || 'n/a');
        console.log('  message:', err.message);
        return false;
    }
};

(async () => {
    console.log('\n--- Neon connection tests ---\n');
    let anyOk = await tryServerless();
    console.log('');
    for (const v of variants) {
        anyOk = (await tryConnect(v.name, v.build())) || anyOk;
        console.log('');
    }

    // If pooler host, also try direct (non-pooler) endpoint
    if (parsed.hostname.includes('-pooler')) {
        const directHost = parsed.hostname.replace('-pooler', '');
        const directUrl = new URL(rawUrl);
        directUrl.hostname = directHost;
        directUrl.searchParams.delete('sslmode');
        console.log('Trying direct endpoint (non-pooler):', directHost);
        anyOk = (await tryConnect('direct endpoint', {
            connectionString: directUrl.toString(),
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 20000,
        })) || anyOk;
        console.log('');
    }

    if (!anyOk) {
        console.log('All connection attempts failed.');
        console.log('Checklist:');
        console.log('  1. Neon project not paused (console.neon.tech)');
        console.log('  2. Copy a fresh connection string from Neon dashboard');
        console.log('  3. Use pooled connection for server apps');
        console.log('  4. Firewall/VPN not blocking outbound port 5432');
        process.exit(1);
    }
    process.exit(0);
})();
