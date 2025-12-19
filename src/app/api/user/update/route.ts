import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { device_id, handle: rawHandle, avatar, name, pin, college_id } = await req.json();
        const handle = rawHandle?.trim(); // Ensure no whitespace

        if (!device_id) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
        }

        // 1. Check if user exists and enforce "One Identity" rule
        const existingRes = await sql`
            SELECT device_id, handle, name FROM users WHERE device_id = ${device_id}
        `;
        const existingUser = existingRes.rows[0];

        if (existingUser?.handle && handle && existingUser.handle !== handle) {
            return NextResponse.json(
                { error: 'Identity Locked. You cannot change your DropID on this device.' },
                { status: 403 }
            );
        }

        if (existingUser?.name && name && existingUser.name !== name) {
            return NextResponse.json(
                { error: 'Identity Locked. You cannot change your name on this device.' },
                { status: 403 }
            );
        }

        // Hash PIN if provided
        let pinHash = null;
        if (pin) {
            pinHash = crypto.createHash('sha256').update(pin).digest('hex');
        }

        // Upsert User
        // Postgres ON CONFLICT syntax
        // Coalesce for PIN: If new PIN (pinHash) is null, keep the old one (users.pin_hash).
        // Postgres: COALESCE(EXCLUDED.pin_hash, users.pin_hash)

        const initialCoins = 100;
        const validCollegeId = college_id || 'unknown';
        const validName = name || '';

        await sql`
            INSERT INTO users (device_id, college_id, handle, avatar, coins, name, pin_hash)
            VALUES (${device_id}, ${validCollegeId}, ${handle}, ${avatar}, ${initialCoins}, ${validName}, ${pinHash})
            ON CONFLICT (device_id) DO UPDATE SET
                handle = EXCLUDED.handle,
                avatar = EXCLUDED.avatar,
                name = EXCLUDED.name,
                pin_hash = COALESCE(EXCLUDED.pin_hash, users.pin_hash),
                college_id = EXCLUDED.college_id
        `;

        return NextResponse.json({ success: true, user: { handle, avatar, name } });

    } catch (error: any) {
        console.error('User Update Error:', error);
        return NextResponse.json({
            error: 'UPDATE_FAILED',
            message: error.message
        }, { status: 500 });
    }
}
