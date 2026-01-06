import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
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
            const userRes = await query(`SELECT college_id FROM users WHERE device_id = $1`, [deviceId]);
            targetCollegeId = userRes.rows[0]?.college_id;
        }

        if (!targetCollegeId) {
            return NextResponse.json({
                feed: [],
                college_name: null,
                meta: { hotCount: 0, newCount: 0 },
                msg: "No college selected or found"
            });
        }

        // 1.5 Fetch College Name
        const collegeRes = await query(`SELECT name FROM colleges WHERE id = $1`, [targetCollegeId]);
        const collegeName = collegeRes.rows[0]?.name || "Unknown College";

        // 1. Fetch RAW "LIVE" confessions with My Vote
        const rawPostsRes = await query(`
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
                (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                EXISTS(SELECT 1 FROM peeks WHERE peeks.confession_id = c.id AND peeks.device_id = $1) as has_peeked
            FROM confessions c
            LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = $1
            LEFT JOIN users u ON u.device_id = c.device_id
            WHERE c.status = 'LIVE' 
                AND c.college_id = $2
                AND c.is_open = false -- STRICT SEPARATION: Only anonymous/closed drops
                AND (c.expires_at IS NULL OR c.expires_at > NOW())
            ORDER BY c.created_at DESC
            LIMIT 200
        `, [deviceId || '', targetCollegeId]);

        // 1.1 Extract Post IDs for reveals and reactions
        const postIds = rawPostsRes.rows.map(row => row.id);

        const rawPosts = rawPostsRes.rows.map(row => ({
            ...row,
            id: row.id,
            myVote: parseInt(row.myvote || '0'),
            upvotes: parseInt(row.upvotes || '0'),
            downvotes: parseInt(row.downvotes || '0'),
            comment_count: parseInt(row.comment_count || '0'),
            is_shadow: !!row.is_shadow,
            is_open: !!row.is_open,
            unlock_votes: parseInt(row.unlock_votes || '0'),
            unlock_threshold: parseInt(row.unlock_threshold || '5'),
            has_peeked: !!row.has_peeked,
            poll_options: typeof row.poll_options === 'string' ? JSON.parse(row.poll_options) : row.poll_options,
            poll_votes: typeof row.poll_votes === 'string' ? JSON.parse(row.poll_votes) : row.poll_votes,
            isDropActive: true
        }));

        // 1.2 Fetch specifically revealed word indices for these posts
        let allReveals: any[] = [];
        if (postIds.length > 0) {
            const revealsRes = await query(`
                SELECT confession_id, word_index 
                FROM peeks 
                WHERE device_id = $1 AND confession_id = ANY($2) AND word_index IS NOT NULL
            `, [deviceId, postIds]);
            allReveals = revealsRes.rows;
        }

        // 1.3 Fetch Reactions for these posts
        let allReactions: any[] = [];
        if (postIds.length > 0) {
            const reactionsRes = await query(`
                SELECT confession_id, emoji, COUNT(*) as count,
                       EXISTS(SELECT 1 FROM reactions r2 WHERE r2.confession_id = r.confession_id AND r2.emoji = r.emoji AND r2.device_id = $1) as active
                FROM reactions r
                WHERE confession_id = ANY($2)
                GROUP BY confession_id, emoji
            `, [deviceId, postIds]);
            allReactions = reactionsRes.rows;
        }

        // 1.4 Combine reveals and reactions
        const rawPostsWithRevealsAndReactions = rawPosts.map(p => ({
            ...p,
            revealed_words: allReveals
                .filter(r => r.confession_id === p.id)
                .map(r => r.word_index),
            reactions: allReactions
                .filter(r => r.confession_id === p.id)
                .map(r => ({ emoji: r.emoji, count: parseInt(r.count), active: !!r.active }))
        }));

        // 2. Apply "The Hook" Algorithm
        // We need to cast types to match what rankFeed expects
        const { feed, hot, new: newLane } = rankFeed(rawPostsWithRevealsAndReactions as any);

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

        // 4. Fetch Worldwide Mega Drop (Highest velocity in last 24h across ALL colleges)
        const globalMegaRes = await query(`
            SELECT 
                c.*, u.handle, u.avatar, col.name as college_name,
                (c.upvotes + (SELECT COUNT(*) FROM messages WHERE confession_id = c.id) + (SELECT COUNT(*) FROM reactions WHERE confession_id = c.id)) as velocity
            FROM confessions c
            LEFT JOIN users u ON u.device_id = c.device_id
            LEFT JOIN colleges col ON col.id = c.college_id
            WHERE c.status = 'LIVE' 
                AND c.created_at > NOW() - INTERVAL '24 hours'
            ORDER BY velocity DESC
            LIMIT 1
        `);
        const globalMegaDrop = globalMegaRes.rows[0] ? {
            ...globalMegaRes.rows[0],
            upvotes: parseInt(globalMegaRes.rows[0].upvotes || '0'),
            is_shadow: !!globalMegaRes.rows[0].is_shadow,
            is_open: !!globalMegaRes.rows[0].is_open,
            unlock_votes: parseInt(globalMegaRes.rows[0].unlock_votes || '0'),
            unlock_threshold: parseInt(globalMegaRes.rows[0].unlock_threshold || '5'),
            isGlobal: true
        } : null;

        // 5. Return the Mix
        return NextResponse.json({
            feed: enrichedFeed,
            college_name: collegeName,
            globalMegaDrop,
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
