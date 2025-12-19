import { NextRequest, NextResponse } from 'next/server';
import db, { Confession } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');
        const id = params.id;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const post = db.prepare(`
            SELECT 
                c.*, 
                COALESCE(v.value, 0) as myVote
            FROM confessions c
            LEFT JOIN votes v ON v.confession_id = c.id AND v.device_id = ?
            WHERE c.id = ?
        `).get(deviceId || '', id) as (Confession & { myVote: number }) | undefined;

        if (!post) {
            return NextResponse.json({ error: 'Confession not found' }, { status: 404 });
        }

        return NextResponse.json(post);

    } catch (error) {
        console.error('Single Confession Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
