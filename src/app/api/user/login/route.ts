import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { handle, pin } = await req.json();

        if (!handle || !pin) {
            return NextResponse.json({ error: 'Handle and PIN required' }, { status: 400 });
        }

        // 1. Hash the provided PIN to compare
        const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

        // 2. Find user by handle
        const cleanHandle = handle.replace('@', '').trim();
        // Check both with and without @ to be safe
        const userRes = await sql`
            SELECT device_id, pin_hash FROM users 
            WHERE handle = ${'@' + cleanHandle} OR handle = ${cleanHandle}
        `;
        const user = userRes.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.pin_hash) {
            return NextResponse.json({ error: 'This account has no recovery PIN set.' }, { status: 403 });
        }

        // 3. Verify PIN
        if (user.pin_hash !== pinHash) {
            return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
        }

        // 4. Success - Return the ORIGINAL device_id
        return NextResponse.json({
            success: true,
            device_id: user.device_id,
            message: 'Recovered successfully'
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
