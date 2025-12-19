import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Query to get top 5 hashtags from LIVE confessions
        const tags = db.prepare(`
            SELECT tag, COUNT(*) as count 
            FROM confessions 
            WHERE status = 'LIVE' AND tag IS NOT NULL 
            GROUP BY tag 
            ORDER BY count DESC 
            LIMIT 5
        `).all() as { tag: string, count: number }[];

        return NextResponse.json({ tags });
    } catch (error) {
        console.error('Trending API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
