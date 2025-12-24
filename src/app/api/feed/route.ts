import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { rankFeed } from '@/lib/algorithm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');
        const filterCollegeId = searchParams.get('college_id'); // Optional college filter

        // 1. Determine which college to show
        let targetCollegeId = filterCollegeId;

        if (!targetCollegeId && deviceId) {
            // Get User's Default College if no filter is provided
            const userRes = await sql`SELECT college_id FROM users WHERE device_id = ${deviceId}`;
            targetCollegeId = userRes.rows[0]?.college_id;
        }

        if (!targetCollegeId) {
            return NextResponse.json({
                feed: [],
                meta: { hotCount: 0, newCount: 0 },
                msg: "No college selected or found"
            });
        }

        // 1. Fetch RAW "LIVE" confessions with My Vote
        // Postgres uses NOW() instead of datetime('now')
        const rawPostsRes = await sql`
            SELECT 
                c.*, 
                COALESCE(v.value, 0) as myVote,
                u.handle,
                u.avatar,
                c.image,
                c.is_shadow,
                c.is_open,
                c.unlock_votes,
                c.unlock_threshold,
                (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count
            FROM confessions c
            LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = ${deviceId || ''}
            LEFT JOIN users u ON u.device_id = c.device_id
            WHERE c.status = 'LIVE' 
                AND c.college_id = ${targetCollegeId}
                AND c.is_open = false -- STRICT SEPARATION: Only anonymous/closed drops
                AND (c.expires_at IS NULL OR c.expires_at > NOW())
            ORDER BY c.created_at DESC
            LIMIT 200
        `;

        // Note: rows returned by 'pg' are objects with lowercase keys by default. 
        // We might need to camelCase them if we used raw SQL, but usually they match column names.
        // Also Postgres result objects have a .rows property.
        const rawPosts = rawPostsRes.rows.map(row => ({
            ...row,
            id: row.id,
            myVote: parseInt(row.myvote || '0'),
            upvotes: parseInt(row.upvotes || '0'),
            downvotes: parseInt(row.downvotes || '0'),
            comment_count: parseInt(row.comment_count || '0'),
            is_shadow: !!row.is_shadow,
            is_open: !!row.is_open,
            unlock_votes: parseInt(row.unlock_votes || '0'), // Legacy support
            unlock_threshold: parseInt(row.unlock_threshold || '5'), // New dynamic threshold
            isDropActive: true // By default active if not expired
        }));

        // 1.5 Fetch Reactions for these posts
        const postIds = rawPosts.map(p => p.id);
        let allReactions: any[] = [];
        if (postIds.length > 0) {
            // Vercel Postgres handles arrays as {1,2,3} format for ANY
            const reactionsRes = await sql`
                SELECT confession_id, emoji, COUNT(*) as count,
                       EXISTS(SELECT 1 FROM reactions r2 WHERE r2.confession_id = r.confession_id AND r2.emoji = r.emoji AND r2.device_id = ${deviceId}) as active
                FROM reactions r
                WHERE confession_id = ANY(${postIds as any})
                GROUP BY confession_id, emoji
            `;
            allReactions = reactionsRes.rows;
        }

        const rawPostsWithReactions = rawPosts.map(p => ({
            ...p,
            reactions: allReactions
                .filter(r => r.confession_id === p.id)
                .map(r => ({ emoji: r.emoji, count: parseInt(r.count), active: !!r.active }))
        }));

        // 2. Apply "The Hook" Algorithm
        // We need to cast types to match what rankFeed expects
        const { feed, hot, new: newLane } = rankFeed(rawPostsWithReactions as any);

        // 3. Enrich with DROP_ACTIVE status
        const now = new Date();
        const enrichedFeed = feed.map(post => {
            const dropActiveAt = post.drop_active_at ? new Date(post.drop_active_at) : null;
            const expiresAt = post.expires_at ? new Date(post.expires_at) : null;

            return {
                ...post,
                isDropActive: dropActiveAt && expiresAt
                    ? (now >= dropActiveAt && now < expiresAt)
                    : false
            };
        });

        // 4. Return the Mix
        return NextResponse.json({
            feed: enrichedFeed,
            meta: {
                hotCount: hot.length,
                newCount: newLane.length
            }
        });

    } catch (error: any) {
        console.error('Feed API Error:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            hint: "Try visiting /api/setup to sync database schema."
        }, { status: 500 });
    }
}
