import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const queryTerm = searchParams.get('q'); // Search query
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

        if (queryTerm) {
            // Search Logic
            const postsRes = await sql`
                SELECT * FROM confessions 
                WHERE status = 'LIVE' 
                AND (content ILIKE ${'%' + queryTerm + '%'} OR tag = ${queryTerm})
                ORDER BY created_at DESC
                LIMIT 50
            `;
            return NextResponse.json({ results: postsRes.rows });
        }

        return NextResponse.json({ message: 'Provide ?q=search or ?trending=true' });

    } catch (error) {
        console.error('Discover Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
