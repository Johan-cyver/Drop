import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { handle: string } }) {
    try {
        const handle = params.handle;
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');

        if (!handle) return NextResponse.json({ error: 'Missing handle' }, { status: 400 });

        // 1. Fetch User Data
        const userRes = await sql`
            SELECT u.handle, u.name, u.avatar, u.created_at, c.name as college_name
            FROM users u
            LEFT JOIN colleges c ON c.id = u.college_id
            WHERE u.handle = ${handle}
        `;
        const user = userRes.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Fetch User's Open Drops
        const postsRes = await sql`
            SELECT 
                c.*,
                u.handle,
                u.avatar,
                (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                COALESCE(v.value, 0) as myVote
            FROM confessions c
            JOIN users u ON u.device_id = c.device_id
            LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = ${deviceId || ''}
            WHERE u.handle = ${handle} 
              AND c.is_open = true 
              AND c.status = 'LIVE'
            ORDER BY c.created_at DESC
            LIMIT 100
        `;

        const drops = postsRes.rows.map(row => ({
            ...row,
            myVote: parseInt(row.myvote || '0'),
            upvotes: parseInt(row.upvotes || '0'),
            downvotes: parseInt(row.downvotes || '0'),
            comment_count: parseInt(row.comment_count || '0')
        }));

        return NextResponse.json({
            user,
            drops
        });

    } catch (error) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
