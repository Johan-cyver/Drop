import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Fetch Users (Limit 50)
        const usersRes = await sql`
            SELECT device_id, handle, college_id, coins, pin_hash, shadow_banned, created_at
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 50
        `;

        // Fetch Posts (Limit 50)
        const postsRes = await sql`
            SELECT id, public_id, content, status, created_at 
            FROM confessions 
            ORDER BY created_at DESC 
            LIMIT 50
        `;

        return NextResponse.json({
            users: usersRes.rows,
            posts: postsRes.rows
        });

    } catch (error) {
        console.error('Admin API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
