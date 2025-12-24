import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');
        const mode = searchParams.get('mode') || 'trending';

        if (mode === 'tags') {
            const tagsRes = await query(`
                SELECT tag, COUNT(*) as count 
                FROM confessions 
                WHERE tag IS NOT NULL 
                GROUP BY tag 
                ORDER BY count DESC 
                LIMIT 10
            `);
            return NextResponse.json({ tags: tagsRes.rows });
        }

        // 1. Get the user's college
        const userRes = await query(`
            SELECT college_id FROM users WHERE device_id = $1
        `, [deviceId || '']);
        const userCollege = userRes.rows[0]?.college_id;

        if (!userCollege) {
            return NextResponse.json({ results: [], trending: { open: [], anonymous: [] } });
        }

        if (mode === 'open_drops') {
            // Strict Open Drops (For "See All" or specific mode)
            const postsRes = await query(`
                SELECT 
                    c.*,
                    u.handle,
                    u.avatar,
                    (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                    (SELECT COUNT(*) FROM messages WHERE confession_id = c.id) as message_count,
                    (SELECT COUNT(*) FROM reactions WHERE confession_id = c.id) as reaction_count,
                    COALESCE(v.value, 0) as myVote,
                    (
                        COALESCE((SELECT COUNT(*) FROM reactions WHERE confession_id = c.id), 0) * 1 +
                        COALESCE((SELECT COUNT(*) FROM messages WHERE confession_id = c.id), 0) * 2
                    ) as activity_score
                FROM confessions c
                LEFT JOIN users u ON u.device_id = c.device_id
                LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = $1
                WHERE c.status = 'LIVE'
                    AND c.college_id = $2
                    AND c.is_open = true
                    AND (c.expires_at IS NULL OR c.expires_at > NOW())
                ORDER BY c.created_at DESC
                LIMIT 50
            `, [deviceId || '', userCollege]);

            const results = postsRes.rows.map(standardizePost);
            return NextResponse.json({ results });
        } else if (mode === 'trending') {
            // Trending: Top 2 Open + Top 2 Closed
            const baseQuery = `
                WITH ActivityMetrics AS (
                    SELECT 
                        c.*,
                        COALESCE((SELECT COUNT(*) FROM reactions WHERE confession_id = c.id), 0) * 1 +
                        COALESCE((SELECT COUNT(*) FROM messages WHERE confession_id = c.id), 0) * 2 as activity_score,
                        u.handle,
                        u.avatar,
                        (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                        (SELECT COUNT(*) FROM messages WHERE confession_id = c.id) as message_count,
                        (SELECT COUNT(*) FROM reactions WHERE confession_id = c.id) as reaction_count,
                        COALESCE(v.value, 0) as myVote
                    FROM confessions c
                    LEFT JOIN users u ON u.device_id = c.device_id
                    LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = $2
                    WHERE c.status = 'LIVE'
                    AND c.college_id = $1
                    AND (c.expires_at IS NULL OR c.expires_at > NOW())
                    -- We look back 7 days for trending
                    AND c.created_at > NOW() - INTERVAL '7 days'
                )
            `;

            const topOpen = await query(`${baseQuery} SELECT * FROM ActivityMetrics WHERE is_open = true AND activity_score > 2 ORDER BY activity_score DESC LIMIT 2`, [userCollege, deviceId || '']);
            const topAnon = await query(`${baseQuery} SELECT * FROM ActivityMetrics WHERE is_open = false AND activity_score > 2 ORDER BY activity_score DESC LIMIT 2`, [userCollege, deviceId || '']);

            return NextResponse.json({
                trending: {
                    open: topOpen.rows.map(standardizePost),
                    anonymous: topAnon.rows.map(standardizePost)
                }
            });
        }

        // Default Search (if q is provided)
        const queryTerm = searchParams.get('q');
        if (queryTerm) {
            const postsRes = await query(`
                SELECT 
                    c.*, u.handle, u.avatar,
                    (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                    (SELECT COUNT(*) FROM messages WHERE confession_id = c.id) as message_count,
                    (SELECT COUNT(*) FROM reactions WHERE confession_id = c.id) as reaction_count,
                    COALESCE(v.value, 0) as myVote
                FROM confessions c
                LEFT JOIN users u ON u.device_id = c.device_id
                LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = $1
                WHERE c.status = 'LIVE'
                    AND c.college_id = $2
                    AND (c.expires_at IS NULL OR c.expires_at > NOW())
                    AND (c.content ILIKE $3 OR c.tag ILIKE $3)
                ORDER BY c.created_at DESC
                LIMIT 50
            `, [deviceId || '', userCollege, `%${queryTerm}%`]);
            return NextResponse.json({ results: postsRes.rows.map(standardizePost) });
        }

        return NextResponse.json({ results: [] });

    } catch (error) {
        console.error('Discover Error:', error);
        return NextResponse.json({ results: [], error: 'Failed' }, { status: 500 });
    }
}

function standardizePost(row: any) {
    return {
        ...row,
        myVote: parseInt(row.myvote || '0'),
        upvotes: parseInt(row.upvotes || '0'),
        downvotes: parseInt(row.downvotes || '0'),
        comment_count: parseInt(row.comment_count || '0'),
        message_count: parseInt(row.message_count || '0'),
        reaction_count: parseInt(row.reaction_count || '0'),
        activity_score: parseInt(row.activity_score || '0'),
        is_open: !!row.is_open,
        is_shadow: !!row.is_shadow
    };
}
