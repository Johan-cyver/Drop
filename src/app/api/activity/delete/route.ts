import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const deviceId = searchParams.get('device_id');

        if (!id || !deviceId) {
            return NextResponse.json({ error: 'Missing id or device_id' }, { status: 400 });
        }

        await query(`
            DELETE FROM notifications 
            WHERE id = $1 AND device_id = $2
        `, [id, deviceId]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Notification Error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
    }
}
