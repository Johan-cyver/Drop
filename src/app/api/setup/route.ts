import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({
                error: "DABATASE_NOT_CONNECTED",
                details: "You haven't connected Vercel Postgres in the dashboard yet. Go to Storage -> Create Database."
            }, { status: 400 });
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
                expires_at TIMESTAMP,
                drop_active_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

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
                id TEXT PRIMARY KEY,
                device_id TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        return NextResponse.json({ success: true, message: 'Database Setup Complete' });
    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({
            error: 'SETUP_FAILED',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
