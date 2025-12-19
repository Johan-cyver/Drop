import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');
        const id = params.id;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const postRes = await sql`
            SELECT 
                c.*, 
                COALESCE(v.value, 0) as myVote,
                u.handle,
                u.avatar,
                c.image
            FROM confessions c
            LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = ${deviceId || ''}
            LEFT JOIN users u ON u.device_id = c.device_id
            WHERE c.id = ${id}
        `;

        const post = postRes.rows[0];

        if (!post) {
            return NextResponse.json({ error: 'Confession not found' }, { status: 404 });
        }

        // Fetch Comments
        const commentsRes = await sql`
            SELECT 
                c.*,
                u.handle,
                u.avatar
            FROM comments c
            JOIN users u ON u.device_id = c.device_id
            WHERE c.confession_id = ${id}
            ORDER BY c.created_at ASC
        `;

        // Standardize types
        const formattedPost = {
            ...post,
            myVote: parseInt(post.myvote || '0'),
            upvotes: post.upvotes || 0,
            downvotes: post.downvotes || 0,
            comments: commentsRes.rows
        };

        return NextResponse.json(formattedPost);

    } catch (error) {
        console.error('Single Confession Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
