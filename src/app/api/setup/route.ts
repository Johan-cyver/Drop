import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const shouldReset = searchParams.get('reset') === 'true';

        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({
                error: "DATABASE_NOT_CONNECTED",
                details: "You haven't connected Vercel Postgres in the dashboard yet. Go to Storage -> Create Database."
            }, { status: 400 });
        }

        if (shouldReset) {
            console.log("Resetting all tables...");
            await sql`DROP TABLE IF EXISTS votes CASCADE`;
            await sql`DROP TABLE IF EXISTS feedback CASCADE`;
            await sql`DROP TABLE IF EXISTS confessions CASCADE`;
            await sql`DROP TABLE IF EXISTS users CASCADE`;
        }

        // 0. Colleges Table (New for database-driven college info)
        await sql`
            CREATE TABLE IF NOT EXISTS colleges (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                city TEXT,
                status TEXT DEFAULT 'VERIFIED',
                created_by TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        // Colleges Migrations
        try {
            await sql`ALTER TABLE colleges ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VERIFIED'`;
            await sql`ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_by TEXT`;
            await sql`ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`;
        } catch (e) {
            console.log("Colleges migration error:", e);
        }

        // Seed Colleges if empty
        const collegesRes = await sql`SELECT COUNT(*) FROM colleges`;
        if (parseInt(collegesRes.rows[0].count) === 0) {
            console.log("Seeding colleges...");
            // We use a simplified seed for the setup route
            const defaultColleges: string[][] = [];
            for (const [id, name, city] of defaultColleges) {
                await sql`INSERT INTO colleges (id, name, city) VALUES (${id}, ${name}, ${city}) ON CONFLICT DO NOTHING`;
            }
        }

        // 1. Users Table
        await sql`
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
        `;

        // Users Migrations
        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS college_id TEXT`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shadow_banned BOOLEAN DEFAULT FALSE`;
        } catch (e) {
            console.log("Users migration error:", e);
        }

        // 2. Confessions Table
        await sql`
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Confessions Migrations
        try {
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS image TEXT`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS public_id TEXT`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS drop_active_at TIMESTAMP`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS is_shadow BOOLEAN DEFAULT FALSE`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS unlock_votes INTEGER DEFAULT 5`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS poll_question TEXT`;
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS poll_options TEXT`;
        } catch (e) {
            console.log("Confessions migration error:", e);
        }

        // 3. Votes Table
        await sql`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                device_id TEXT,
                confession_id TEXT,
                value INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(device_id, confession_id)
            );
        `;

        // Migration: Make all existing colleges VERIFIED for the new filter
        try {
            await sql`UPDATE colleges SET status = 'VERIFIED' WHERE status = 'PENDING'`;
        } catch (e) {
            console.log("Migration (colleges status) error or already done:", e);
        }
        await sql`
            CREATE TABLE IF NOT EXISTS feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                device_id TEXT,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        try {
            await sql`ALTER TABLE feedback ADD CONSTRAINT fk_user_feedback FOREIGN KEY (device_id) REFERENCES users(device_id)`;
        } catch (e) {
            console.log("Migration (feedback) already applied or minor error:", e);
        }

        // 5. Comments Table
        await sql`
            CREATE TABLE IF NOT EXISTS comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                confession_id TEXT,
                device_id TEXT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        // Migration: Ensure types match for foreign keys & add parent_id for threading
        try {
            console.log("Running migrations...");
            await sql`ALTER TABLE comments ALTER COLUMN confession_id TYPE TEXT`;
            await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID`;
            await sql`ALTER TABLE comments ADD CONSTRAINT fk_confession FOREIGN KEY (confession_id) REFERENCES confessions(id) ON DELETE CASCADE`;
        } catch (e) {
            console.log("Migration (comments) already applied or minor error:", e);
        }

        // 6. Reactions Table
        await sql`
            CREATE TABLE IF NOT EXISTS reactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                confession_id TEXT REFERENCES confessions(id) ON DELETE CASCADE,
                device_id TEXT,
                emoji TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(confession_id, device_id, emoji)
            );
        `;

        // 7. Messages Table (Drop Chat)
        await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                confession_id TEXT REFERENCES confessions(id) ON DELETE CASCADE,
                device_id TEXT,
                handle TEXT,
                avatar TEXT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

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
