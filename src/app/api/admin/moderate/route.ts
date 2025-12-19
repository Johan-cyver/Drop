import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, target_id } = body;

        if (!action || !target_id) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'BAN_USER') {
            await sql`UPDATE users SET shadow_banned = true WHERE device_id = ${target_id}`;
            return NextResponse.json({ success: true, message: 'User shadow banned' });
        }

        if (action === 'UNBAN_USER') {
            await sql`UPDATE users SET shadow_banned = false WHERE device_id = ${target_id}`;
            return NextResponse.json({ success: true, message: 'User unbanned' });
        }

        if (action === 'DELETE_POST') {
            // Soft Delete (Reject)
            await sql`UPDATE confessions SET status = 'REJECTED' WHERE id = ${target_id}`;
            return NextResponse.json({ success: true, message: 'Post rejected' });
        }

        if (action === 'HARD_DELETE_POST') {
            // Hard Delete (Remove from DB)
            await sql`DELETE FROM confessions WHERE id = ${target_id}`;
            return NextResponse.json({ success: true, message: 'Post permanently deleted' });
        }

        if (action === 'FLAG_POST') {
            await sql`UPDATE confessions SET status = 'FLAGGED' WHERE id = ${target_id}`;
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
