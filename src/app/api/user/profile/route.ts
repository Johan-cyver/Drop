import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');

        if (!deviceId) return NextResponse.json({ error: 'Missing Device ID' }, { status: 400 });

        // 1. Fetch User Stats (Join with colleges for name)
        const userRes = await sql`
            SELECT u.*, c.name as college_name 
            FROM users u
            LEFT JOIN colleges c ON u.college_id = c.id
            WHERE u.device_id = ${deviceId}
        `;
        const user = userRes.rows[0];

        // 2. Fetch User's Posts
        const myPostsRes = await sql`
            SELECT * FROM confessions 
            WHERE device_id = ${deviceId} 
            ORDER BY created_at DESC
        `;
        const myPosts = myPostsRes.rows;

        // 3. Simple Stats
        const totalUpvotes = myPosts.reduce((acc, p) => acc + (p.upvotes || 0), 0);
        const totalDownvotes = myPosts.reduce((acc, p) => acc + (p.downvotes || 0), 0);
        const karma = totalUpvotes - totalDownvotes + (myPosts.length * 5);

        return NextResponse.json({
            user: user || { device_id: deviceId, risk_score: 0, handle: 'drop_member' },
            stats: {
                joinedAt: user?.created_at || new Date().toISOString(),
                karma: Math.max(0, karma),
                postsCount: myPosts.length
            },
            posts: myPosts
        });

    } catch (error: any) {
        console.error('Profile Error:', {
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            hint: "Try visiting /api/setup to sync database schema."
        }, { status: 500 });
    }
}
