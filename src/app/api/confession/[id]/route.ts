import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id') || '';
        const id = params.id;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const postRes = await query(`
            SELECT 
                c.*, 
                COALESCE(v.value, 0) as myVote,
                u.handle,
                u.avatar,
                c.image,
                c.is_shadow,
                c.is_open,
                c.unlock_votes
            FROM confessions c
            LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = $1
            LEFT JOIN users u ON u.device_id = c.device_id
            WHERE c.id = $2
        `, [deviceId, id]);

        const post = postRes.rows[0];

        if (!post) {
            return NextResponse.json({ error: 'Confession not found' }, { status: 404 });
        }

        // Fetch Comments - Using LEFT JOIN to ensure comments are visible even if user profile is missing
        const commentsRes = await query(`
            SELECT 
                c.*,
                COALESCE(u.handle, 'Anonymous') as handle,
                COALESCE(u.avatar, 'ghost') as avatar
            FROM comments c
            LEFT JOIN users u ON u.device_id = c.device_id
            WHERE c.confession_id = $1
            ORDER BY c.created_at ASC
        `, [id]);

        // Fetch Reactions
        const reactionsRes = await query(`
            SELECT emoji, COUNT(*) as count,
                   EXISTS(SELECT 1 FROM reactions r2 WHERE r2.confession_id = r.confession_id AND r2.emoji = r.emoji AND r2.device_id = $1) as active
            FROM reactions r
            WHERE confession_id = $2
            GROUP BY emoji
        `, [deviceId, id]);

        // Standardize types
        const now = new Date();
        const dropActiveAt = post.drop_active_at ? new Date(post.drop_active_at) : null;
        const expiresAt = post.expires_at ? new Date(post.expires_at) : null;

        const formattedPost = {
            ...post,
            myVote: parseInt(post.myvote || '0'),
            upvotes: parseInt(post.upvotes || '0'),
            downvotes: parseInt(post.downvotes || '0'),
            is_shadow: !!post.is_shadow,
            is_open: !!post.is_open,
            unlock_votes: parseInt(post.unlock_votes || '0'),
            isDropActive: dropActiveAt && expiresAt
                ? (now >= dropActiveAt && now < expiresAt)
                : false,
            comments: commentsRes.rows,
            reactions: reactionsRes.rows.map(r => ({ emoji: r.emoji, count: parseInt(r.count), active: !!r.active }))
        };

        return NextResponse.json(formattedPost);

    } catch (error: any) {
        console.error('Single Confession Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
