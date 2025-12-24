import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const device_id = searchParams.get('device_id');

    if (!device_id) {
        return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    try {
        const userRes = await query(`SELECT handle, avatar, shadow_banned, college_id FROM users WHERE device_id = $1`, [device_id]);
        const user = userRes.rows[0];

        if (!user) {
            return NextResponse.json({ exists: false, hasHandle: false });
        }

        return NextResponse.json({
            exists: true,
            hasHandle: !!user.handle,
            handle: user.handle,
            avatar: user.avatar,
            college_id: user.college_id,
            blocked: user.shadow_banned === true // Explicit boolean check for Postgres
        });

    } catch (error: any) {
        console.error('Check error:', error);
        return NextResponse.json({
            error: 'CHECK_FAILED',
            message: error.message
        }, { status: 500 });
    }
}
