import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // Security Gate
        const auth = req.headers.get('x-admin-secret');
        const secret = process.env.ADMIN_SECRET || 'drop_admin_2024';

        if (auth !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, target_id, new_college_id } = body;

        if (!action || !target_id) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'BAN_USER') {
            await query(`UPDATE users SET shadow_banned = true WHERE device_id = $1`, [target_id]);
            return NextResponse.json({ success: true, message: 'User shadow banned' });
        }

        if (action === 'UNBAN_USER') {
            await query(`UPDATE users SET shadow_banned = false WHERE device_id = $1`, [target_id]);
            return NextResponse.json({ success: true, message: 'User unbanned' });
        }

        if (action === 'MOVE_USER') {
            if (!new_college_id) return NextResponse.json({ error: 'New college ID required' }, { status: 400 });
            await query(`UPDATE users SET college_id = $1 WHERE device_id = $2`, [new_college_id, target_id]);
            return NextResponse.json({ success: true, message: `User moved to ${new_college_id}` });
        }

        if (action === 'DELETE_POST') {
            // Soft Delete (Reject)
            await query(`UPDATE confessions SET status = 'REJECTED' WHERE id = $1`, [target_id]);
            return NextResponse.json({ success: true, message: 'Post rejected' });
        }

        if (action === 'HARD_DELETE_POST') {
            // Hard Delete (Remove from DB)
            await query(`DELETE FROM confessions WHERE id = $1`, [target_id]);
            return NextResponse.json({ success: true, message: 'Post permanently deleted' });
        }

        if (action === 'FLAG_POST') {
            await query(`UPDATE confessions SET status = 'FLAGGED' WHERE id = $1`, [target_id]);
            return NextResponse.json({ success: true, message: 'Post flagged' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Moderation Error:', error);
        return NextResponse.json({
            error: 'MODERATION_FAILED',
            message: error.message
        }, { status: 500 });
    }
}
