import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const shouldReset = searchParams.get('reset') === 'true';

        if (shouldReset) {
            console.log("Resetting all tables...");
            await query(`DROP TABLE IF EXISTS votes CASCADE`);
            await query(`DROP TABLE IF EXISTS feedback CASCADE`);
            await query(`DROP TABLE IF EXISTS confessions CASCADE`);
            await query(`DROP TABLE IF EXISTS users CASCADE`);
            await query(`DROP TABLE IF EXISTS messages CASCADE`);
            await query(`DROP TABLE IF EXISTS reactions CASCADE`);
            await query(`DROP TABLE IF EXISTS comments CASCADE`);
            await query(`DROP TABLE IF EXISTS colleges CASCADE`);
        }

        // 0. Colleges Table
        await query(`
            CREATE TABLE IF NOT EXISTS colleges (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                city TEXT,
                status TEXT DEFAULT 'VERIFIED',
                created_by TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Colleges Migrations
        try {
            await query(`ALTER TABLE colleges ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VERIFIED'`);
            await query(`ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_by TEXT`);
            await query(`ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
        } catch (e) {
            console.log("Colleges migration error:", e);
        }

        // Seed Colleges if empty
        const collegesRes = await query(`SELECT COUNT(*) FROM colleges`);
        if (parseInt(collegesRes.rows[0].count) === 0) {
            console.log("Seeding colleges...");
            const defaultColleges = [
                ['dsu', 'Dayananda Sagar University', 'Bengaluru'],
                ['dsce', 'Dayananda Sagar College of Engineering', 'Bengaluru'],
                ['rvce', 'RV College of Engineering', 'Bengaluru'],
                ['bmsce', 'BMS College of Engineering', 'Bengaluru'],
                ['pes-rr', 'PES University (RR Campus)', 'Bengaluru'],
                ['msrit', 'Ramaiah Institute of Technology', 'Bengaluru'],
                ['mit-manipal', 'Manipal Institute of Technology', 'Manipal']
            ];
            for (const [id, name, city] of defaultColleges) {
                await query(`INSERT INTO colleges (id, name, city) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [id, name, city]);
            }
        }

        // 1. Users Table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                device_id TEXT PRIMARY KEY,
                handle TEXT UNIQUE,
                pin_hash TEXT,
                avatar TEXT,
                name TEXT,
                college_id TEXT,
                coins INTEGER DEFAULT 100,
                shadow_banned BOOLEAN DEFAULT FALSE,
                last_post_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Users Migrations
        try {
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS college_id TEXT`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS impact INTEGER DEFAULT 0`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS shadow_banned BOOLEAN DEFAULT FALSE`);
        } catch (e) {
            console.log("Users migration error:", e);
        }

        // 2. Confessions Table
        await query(`
            CREATE TABLE IF NOT EXISTS confessions (
                id TEXT PRIMARY KEY,
                public_id TEXT,
                content TEXT,
                college_id TEXT,
                device_id TEXT,
                upvotes INTEGER DEFAULT 0,
                downvotes INTEGER DEFAULT 0,
                status TEXT DEFAULT 'LIVE',
                tag TEXT,
                image TEXT,
                expires_at TIMESTAMP,
                drop_active_at TIMESTAMP,
                is_shadow BOOLEAN DEFAULT FALSE,
                is_open BOOLEAN DEFAULT FALSE,
                unlock_votes INTEGER DEFAULT 0,
                unlock_threshold INTEGER DEFAULT 5,
                tease_content TEXT,
                tease_mode TEXT DEFAULT 'none', -- none, 3_words, 1_sentence, custom
                has_poll BOOLEAN DEFAULT FALSE,
                poll_options JSONB, -- Array of strings
                poll_votes JSONB DEFAULT '{}', -- Object mapping index to count
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Confessions Migrations
        try {
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS image TEXT`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS public_id TEXT`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS drop_active_at TIMESTAMP`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS is_shadow BOOLEAN DEFAULT FALSE`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS unlock_votes INTEGER DEFAULT 5`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS unlock_threshold INTEGER DEFAULT 5`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS tease_mode TEXT DEFAULT 'none'`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS has_poll BOOLEAN DEFAULT FALSE`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS poll_options JSONB`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS poll_votes JSONB DEFAULT '{}'`);
            await query(`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS tease_content TEXT`);
        } catch (e) {
            console.log("Confessions migration error:", e);
        }

        // 3. Votes Table
        await query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                device_id TEXT,
                confession_id TEXT,
                value INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(device_id, confession_id)
            );
        `);

        // Migration: Make all existing colleges VERIFIED
        try {
            await query(`UPDATE colleges SET status = 'VERIFIED' WHERE status = 'PENDING'`);
        } catch (e) {
            console.log("Migration (colleges status) error or already done:", e);
        }

        // 4. Feedback Table
        await query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                device_id TEXT,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 5. Comments Table
        await query(`
            CREATE TABLE IF NOT EXISTS comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                confession_id TEXT,
                device_id TEXT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Comments Migrations
        try {
            await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID`);
        } catch (e) {
            console.log("Migration (comments) already applied or minor error:", e);
        }

        // 6. Reactions Table
        await query(`
            CREATE TABLE IF NOT EXISTS reactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                confession_id TEXT REFERENCES confessions(id) ON DELETE CASCADE,
                device_id TEXT,
                emoji TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(confession_id, device_id, emoji)
            );
        `);

        // 7. Messages Table (Drop Chat)
        await query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                confession_id TEXT REFERENCES confessions(id) ON DELETE CASCADE,
                device_id TEXT,
                handle TEXT,
                avatar TEXT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 8. Reward Tracking Table (Prevent abuse)
        await query(`
            CREATE TABLE IF NOT EXISTS reward_tracking (
                id SERIAL PRIMARY KEY,
                confession_id TEXT,
                device_id TEXT,
                action_type TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(confession_id, device_id, action_type)
            );
        `);

        // 9. Peeks Table (Spending coins to unlock content early)
        await query(`
            CREATE TABLE IF NOT EXISTS peeks (
                id SERIAL PRIMARY KEY,
                device_id TEXT,
                confession_id TEXT REFERENCES confessions(id) ON DELETE CASCADE,
                word_index INTEGER, -- NULL means fully revealed
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(device_id, confession_id, word_index)
            );
        `);

        // Migration for peeks
        try {
            await query(`ALTER TABLE peeks ADD COLUMN IF NOT EXISTS word_index INTEGER`);
            // Update constraint: Drop old unique and add new one
            await query(`ALTER TABLE peeks DROP CONSTRAINT IF EXISTS peeks_device_id_confession_id_key`);
            await query(`ALTER TABLE peeks ADD CONSTRAINT peeks_did_cid_wid_unique UNIQUE (device_id, confession_id, word_index)`);
        } catch (e) {
            console.log("Peeks migration error (likely already applied):", e);
        }

        // 11. Notifications Table
        await query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                device_id TEXT NOT NULL,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                amount INTEGER,
                confession_id TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        return NextResponse.json({
            success: true,
            message: shouldReset ? 'Database Wipe and Reset Complete' : 'Database Setup Complete',
            reset: shouldReset
        });

    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({
            error: 'SETUP_FAILED',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
