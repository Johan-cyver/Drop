import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest) {
    try {
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
                shadow_banned INTEGER DEFAULT 0,
                last_post_at TEXT,
                created_at TEXT DEFAULT (NOW())
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
                expires_at TEXT,
                drop_active_at TEXT,
                created_at TEXT DEFAULT (NOW()),
                FOREIGN KEY(device_id) REFERENCES users(device_id)
            );
        `;

        // 3. Votes Table
        await sql`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                device_id TEXT,
                confession_id TEXT,
                value INTEGER,
                created_at TEXT DEFAULT (NOW()),
                UNIQUE(device_id, confession_id)
            );
        `;

        // 4. Feedback Table
        await sql`
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                device_id TEXT,
                message TEXT,
                created_at TEXT DEFAULT (NOW())
            );
        `;

        return NextResponse.json({ success: true, message: 'Database Setup Complete' });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
