import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const queryTerm = searchParams.get('q'); // Search query
        const openDrops = searchParams.get('open'); // New: Fetch open drops
        const deviceId = searchParams.get('device_id');
        const getTrending = searchParams.get('trending'); // If true, return tags

        if (getTrending === 'true') {
            const tagsRes = await sql`
                SELECT tag, COUNT(*) as count 
                FROM confessions 
                WHERE tag IS NOT NULL 
                AND status = 'LIVE' 
                GROUP BY tag 
                ORDER BY count DESC 
                LIMIT 10
            `;
            return NextResponse.json({ tags: tagsRes.rows });
        }

        if (openDrops === 'true') {
            const postsRes = await sql`
                SELECT 
                    c.*,
                    u.handle,
                    u.avatar,
                    (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                    COALESCE(v.value, 0) as myVote
                FROM confessions c
                LEFT JOIN users u ON u.device_id = c.device_id
                LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = ${deviceId || ''}
                WHERE c.is_open = true 
                  AND c.status = 'LIVE'
                ORDER BY c.created_at DESC
                LIMIT 50
            `;
            // Standardize return for FE
            const results = postsRes.rows.map(row => ({
                ...row,
                myVote: parseInt(row.myvote || '0'),
                upvotes: parseInt(row.upvotes || '0'),
                downvotes: parseInt(row.downvotes || '0'),
                comment_count: parseInt(row.comment_count || '0'),
                is_open: !!row.is_open,
                is_shadow: !!row.is_shadow
            }));
            return NextResponse.json({ results });
        }

        if (queryTerm) {
            // Search Logic
            const postsRes = await sql`
                SELECT 
                    c.*,
                    u.handle,
                    u.avatar,
                    (SELECT COUNT(*) FROM comments WHERE confession_id = c.id) as comment_count,
                    COALESCE(v.value, 0) as myVote
                FROM confessions c
                LEFT JOIN users u ON u.device_id = c.device_id
                LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = ${deviceId || ''}
                WHERE c.status = 'LIVE' 
                AND (c.content ILIKE ${'%' + queryTerm + '%'} OR c.tag = ${queryTerm})
                ORDER BY c.created_at DESC
                LIMIT 50
            `;
            const results = postsRes.rows.map(row => ({
                ...row,
                myVote: parseInt(row.myvote || '0'),
                upvotes: parseInt(row.upvotes || '0'),
                downvotes: parseInt(row.downvotes || '0'),
                comment_count: parseInt(row.comment_count || '0'),
                is_open: !!row.is_open,
                is_shadow: !!row.is_shadow
            }));
            return NextResponse.json({ results });
        }

        return NextResponse.json({ message: 'Provide ?q=search or ?trending=true' });

    } catch (error) {
        console.error('Discover Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
