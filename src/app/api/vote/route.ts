import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { confession_id, value, device_id } = await req.json();

        if (!confession_id || !device_id) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 1. Update or Insert Vote
        await query(`
            INSERT INTO votes (device_id, confession_id, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (device_id, confession_id)
            DO UPDATE SET value = $3
        `, [device_id, confession_id, value]);

        // 2. Recalculate upvotes/downvotes for the confession
        const votesRes = await query(`
            SELECT 
                SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as ups,
                SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) as downs
            FROM votes
            WHERE confession_id = $1
        `, [confession_id]);

        const ups = parseInt(votesRes.rows[0].ups || '0');
        const downs = parseInt(votesRes.rows[0].downs || '0');

        await query(`
            UPDATE confessions 
            SET upvotes = $1, downvotes = $2 
            WHERE id = $3
        `, [ups, downs, confession_id]);

        return NextResponse.json({ success: true, upvotes: ups, downvotes: downs });

    } catch (error: any) {
        console.error('Vote Error:', error);
        return NextResponse.json({ error: 'VOTE_FAILED', message: error.message }, { status: 500 });
    }
}
