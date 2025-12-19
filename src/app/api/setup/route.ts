import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

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

        // Migration: Add image column if it doesn't exist in older DBs
        try {
            await sql`ALTER TABLE confessions ADD COLUMN IF NOT EXISTS image TEXT`;
        } catch (e) {
            console.log("Migration (confessions.image) error:", e);
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

        // 4. Feedback Table
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

        // Migration: Ensure types match for foreign keys
        try {
            console.log("Running migrations...");
            // Correct confession_id type if it was UUID
            await sql`ALTER TABLE comments ALTER COLUMN confession_id TYPE TEXT`;
            await sql`ALTER TABLE comments ADD CONSTRAINT fk_confession FOREIGN KEY (confession_id) REFERENCES confessions(id) ON DELETE CASCADE`;
        } catch (e) {
            console.log("Migration (comments) already applied or minor error:", e);
        }

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
