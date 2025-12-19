import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');

        if (!deviceId) return NextResponse.json({ error: 'Device ID required' }, { status: 400 });

        // Fetch upvotes on MY posts (excluding my own votes if any)
        const notificationsRes = await sql`
            SELECT 
                c.id as confession_id, 
                c.content, 
                COUNT(v.value) as count,
                MAX(v.created_at) as last_activity
            FROM confessions c
            JOIN votes v ON v.confession_id = c.id
            WHERE c.device_id = ${deviceId} AND v.value = 1 AND v.device_id != ${deviceId}
            GROUP BY c.id, c.content
            ORDER BY last_activity DESC
            LIMIT 20
        `;

        const notifications = notificationsRes.rows;

        const formatted = notifications.map(n => ({
            id: n.confession_id,
            type: 'upvote',
            message: `${n.count} people liked your drop: "${n.content.slice(0, 20)}..."`,
            time: n.last_activity
        }));

        return NextResponse.json({ notifications: formatted });

    } catch (error) {
        console.error('Activity API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
