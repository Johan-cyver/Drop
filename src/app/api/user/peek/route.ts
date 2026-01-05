import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { confession_id, device_id } = await req.json();
        const PEEK_COST = 50;

        if (!confession_id || !device_id) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 1. Check if already peeked
        const existing = await query(
            `SELECT 1 FROM peeks WHERE device_id = $1 AND confession_id = $2`,
            [device_id, confession_id]
        );
        if (existing.rows.length > 0) {
            return NextResponse.json({ success: true, already: true });
        }

        // 2. Check balance
        const userRes = await query(`SELECT coins FROM users WHERE device_id = $1`, [device_id]);
        const coins = userRes.rows[0]?.coins || 0;

        if (coins < PEEK_COST) {
            return NextResponse.json({ error: 'Insufficent coins' }, { status: 403 });
        }

        // 3. Deduct coins and Record Peek
        await query(`UPDATE users SET coins = coins - $1 WHERE device_id = $2`, [PEEK_COST, device_id]);
        await query(`INSERT INTO peeks (device_id, confession_id) VALUES ($1, $2)`, [device_id, confession_id]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Peek Error:', error);
        return NextResponse.json({ error: 'PEEK_FAILED', message: error.message }, { status: 500 });
    }
}
