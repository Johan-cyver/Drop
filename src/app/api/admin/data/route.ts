import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Security Gate
        const auth = req.headers.get('x-admin-secret');
        const secret = process.env.ADMIN_SECRET || 'drop_admin_2024'; // Fallback for local

        if (auth !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Users with College Info (Limit 100)
        const usersRes = await sql`
            SELECT 
                u.device_id, 
                u.handle, 
                u.college_id,
                c.name as college_name,
                c.city as college_city,
                u.coins, 
                u.pin_hash, 
                u.shadow_banned, 
                u.created_at
            FROM users u
            LEFT JOIN colleges c ON u.college_id = c.id
            ORDER BY u.created_at DESC 
            LIMIT 100
        `;

        // Fetch Posts (Limit 50)
        const postsRes = await sql`
            SELECT id, public_id, content, status, created_at 
            FROM confessions 
            ORDER BY created_at DESC 
            LIMIT 50
        `;

        // Fetch College Membership Stats
        const collegesRes = await sql`
            SELECT 
                c.id,
                c.name,
                c.city,
                c.status,
                COUNT(u.device_id) as user_count
            FROM colleges c
            LEFT JOIN users u ON u.college_id = c.id
            GROUP BY c.id, c.name, c.city, c.status
            ORDER BY user_count DESC, c.name ASC
        `;

        return NextResponse.json({
            users: usersRes.rows,
            posts: postsRes.rows,
            colleges: collegesRes.rows
        });

    } catch (error) {
        console.error('Admin API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
