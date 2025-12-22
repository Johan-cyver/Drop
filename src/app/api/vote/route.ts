import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected (POSTGRES_URL missing)' }, { status: 500 });
        }

        const body = await req.json();
        const { confession_id, value, device_id } = body; // value: 1 or -1

        if (!confession_id || !device_id || ![1, -1].includes(value)) {
            return NextResponse.json({ error: 'Invalid vote data' }, { status: 400 });
        }

        // Vercel Postgres Transaction
        // We use a simple sequential logic here effectively since we can't lock easily without more complex setup
        // But for this scale, sequential awaits are "good enough" vs the race condition risk (which is small for now)

        // 1. Check existing vote
        const existingRes = await sql`
            SELECT value FROM votes WHERE device_id = ${device_id} AND confession_id = ${confession_id}
        `;
        const existing = existingRes.rows[0];

        let delta = 0;

        if (existing) {
            if (existing.value === value) {
                // Toggle Off (Remove vote)
                await sql`DELETE FROM votes WHERE device_id = ${device_id} AND confession_id = ${confession_id}`;
                delta = -value; // Reverse the previous effect
            } else {
                // Change Vote (e.g. Up to Down)
                await sql`UPDATE votes SET value = ${value} WHERE device_id = ${device_id} AND confession_id = ${confession_id}`;
                delta = value * 2; // e.g. -1 -> 1 is +2 difference
            }
        } else {
            // New Vote
            await sql`INSERT INTO votes (device_id, confession_id, value) VALUES (${device_id}, ${confession_id}, ${value})`;
            delta = value;
        }

        // 2. Update Confession Counter using atomic recalculation
        if (delta !== 0) {
            const countsRes = await sql`
                SELECT 
                    SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as ups,
                    SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) as downs
                FROM votes WHERE confession_id = ${confession_id}
            `;
            const counts = countsRes.rows[0];

            await sql`
                UPDATE confessions 
                SET upvotes = ${counts.ups || 0}, downvotes = ${counts.downs || 0} 
                WHERE id = ${confession_id}
            `;
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Vote Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
