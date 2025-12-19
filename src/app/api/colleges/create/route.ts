import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, location, device_id } = body;

        if (!name || !device_id) {
            return NextResponse.json({ error: 'College name is required' }, { status: 400 });
        }

        // Check if user exists
        const userRes = await sql`SELECT device_id FROM users WHERE device_id = ${device_id}`;
        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 403 });
        }

        const id = `clg-${randomUUID().slice(0, 8)}`;

        // Insert as 'PENDING' for admin review
        await sql`
            INSERT INTO users (device_id, college_id) 
            VALUES (${device_id}, ${id}) 
            ON CONFLICT (device_id) DO UPDATE SET college_id = ${id}
        `;

        // Note: In a real app, we'd have a 'colleges' table. 
        // For this MVP, we just assign the college_id to the user.
        // The admin can later unify these.

        return NextResponse.json({ success: true, college_id: id });

    } catch (error: any) {
        console.error('Create College Error:', error);
        return NextResponse.json({ error: 'Failed to suggest college' }, { status: 500 });
    }
}
