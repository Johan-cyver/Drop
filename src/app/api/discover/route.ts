import { NextRequest, NextResponse } from 'next/server';
import db, { Confession } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q'); // Search query
        const getTrending = searchParams.get('trending'); // If true, return tags

        if (getTrending === 'true') {
            const tags = db.prepare(`
                SELECT tag, COUNT(*) as count 
                FROM confessions 
                WHERE tag IS NOT NULL 
                AND status = 'LIVE' 
                GROUP BY tag 
                ORDER BY count DESC 
                LIMIT 10
            `).all();
            return NextResponse.json({ tags });
        }

        if (query) {
            // Search Logic
            const posts = db.prepare(`
                SELECT * FROM confessions 
                WHERE status = 'LIVE' 
                AND (content LIKE ? OR tag = ?)
                ORDER BY created_at DESC
                LIMIT 50
            `).all(`%${query}%`, query) as Confession[];
            return NextResponse.json({ results: posts });
        }

        return NextResponse.json({ message: 'Provide ?q=search or ?trending=true' });

    } catch (error) {
        console.error('Discover Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
