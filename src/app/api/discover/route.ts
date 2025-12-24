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
            return NextResponse.json({ results: [] });
        }

        let postsRes: any;

        if (mode === 'open_drops') {
            // Strict Open Drops: Active, Open, Time-limited
            postsRes = await query(`
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
        } else {
            // Trending: Specific Mix (Top 2 Open + Top 2 Closed)
            // Constraints: Last 7 Days AND Activity Score > 2
            postsRes = await query(`
                WITH ActivityMetrics AS (
                    SELECT 
                        c.*,
                        COALESCE((SELECT COUNT(*) FROM reactions WHERE confession_id = c.id), 0) * 1 +
                        COALESCE((SELECT COUNT(*) FROM messages WHERE confession_id = c.id), 0) * 2 as activity_score,
                        (SELECT content FROM messages WHERE confession_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_message_content,
                        (SELECT handle FROM messages WHERE confession_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_message_handle
                    FROM confessions c
                    WHERE c.status = 'LIVE'
                    AND c.college_id = $1
                    AND c.created_at > NOW() - INTERVAL '7 days' -- Time Limit
                ),
                TopOpen AS (
                    SELECT * FROM ActivityMetrics
                    WHERE is_open = true
                    AND activity_score > 2 -- Minimum Threshold
                    ORDER BY activity_score DESC
                    LIMIT 2
                ),
                TopClosed AS (
                    SELECT * FROM ActivityMetrics
                    WHERE is_open = false
                    AND activity_score > 2 -- Minimum Threshold
                    ORDER BY activity_score DESC
                    LIMIT 2
                )
                SELECT 
                    am.*,
                    u.handle,
                    u.avatar,
                    (SELECT COUNT(*) FROM comments WHERE confession_id = am.id) as comment_count,
                    (SELECT COUNT(*) FROM messages WHERE confession_id = am.id) as message_count,
                    (SELECT COUNT(*) FROM reactions WHERE confession_id = am.id) as reaction_count,
                    COALESCE(v.value, 0) as myVote
                FROM (
                    SELECT * FROM TopOpen
                    UNION ALL
                    SELECT * FROM TopClosed
                ) am
                LEFT JOIN users u ON u.device_id = am.device_id
                LEFT JOIN votes v ON v.confession_id = am.id AND v.device_id = $2
                ORDER BY am.activity_score DESC
            `, [userCollege, deviceId || '']);
        }

        // Standardize return for FE
        const results = postsRes.rows.map((row: any) => ({
            ...row,
            myVote: parseInt(row.myvote || '0'),
            upvotes: parseInt(row.upvotes || '0'),
            downvotes: parseInt(row.downvotes || '0'),
            comment_count: parseInt(row.comment_count || '0'),
            message_count: parseInt(row.message_count || '0'),
            reaction_count: parseInt(row.reaction_count || '0'),
            activity_score: parseInt(row.activity_score || '0'),
            latest_message_content: row.latest_message_content,
            latest_message_handle: row.latest_message_handle,
            is_open: !!row.is_open,
            is_shadow: !!row.is_shadow
        }));
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Discover Error:', error);
        return NextResponse.json({ results: [], error: 'Failed to fetch discover feed' }, { status: 500 });
    }
}
