import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: NextRequest) {
    try {
        const { device_id, name, avatar } = await req.json();

        if (!device_id) {
            return NextResponse.json({ error: 'Missing Device ID' }, { status: 400 });
        }

        // Update user profile
        // If avatar starts with data: its a base64 string, otherwise a preset emoji
        await sql`
            UPDATE users 
            SET name = COALESCE(${name}, name),
                avatar = COALESCE(${avatar}, avatar)
            WHERE device_id = ${device_id}
        `;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
