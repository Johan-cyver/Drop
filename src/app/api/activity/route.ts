import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');

        if (!deviceId) return NextResponse.json({ error: 'Device ID required' }, { status: 400 });

        const notificationsRes = await sql`
            SELECT * FROM notifications 
            WHERE device_id = ${deviceId} 
            ORDER BY created_at DESC 
            LIMIT 30
        `;

        const formatted = notificationsRes.rows.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            amount: n.amount,
            confession_id: n.confession_id,
            is_read: n.is_read,
            time: n.created_at
        }));

        return NextResponse.json({ notifications: formatted });

    } catch (error) {
        console.error('Activity API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
