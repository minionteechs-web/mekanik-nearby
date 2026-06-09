const db = require('../config/db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        console.log('Seeding demo data...');

        // 1. Create a demo mechanic user
        const passwordHash = await bcrypt.hash('password123', 10);

        const userRes = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
            ['mechanic_joe', 'joe@example.com', passwordHash, 'mechanic']
        );

        if (userRes.rowCount > 0) {
            const userId = userRes.rows[0].id;

            // 2. Create mechanic profile
            // Coordinates for a central location (e.g., Lagos context as used in Home.js default)
            await db.query(
                `INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userId, 'Job Auto Works', 'Engine Specialist', '123 Victoria Island', 'Lagos', 'Lagos', 6.4281, 3.4219]
            );

            console.log('Demo mechanic "Job" created.');
        }

        // Add a second one
        const userRes2 = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
            ['sam_repairs', 'sam@example.com', passwordHash, 'mechanic']
        );

        if (userRes2.rowCount > 0) {
            const userId2 = userRes2.rows[0].id;
            await db.query(
                `INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userId2, 'Dominion Mobile Repairs', 'Tire & Brake Specialist', '45 Lekki Phase 1', 'Lagos', 'Lagos', 6.4411, 3.4736]
            );
            console.log('Demo mechanic "Dominion" created.');
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();
