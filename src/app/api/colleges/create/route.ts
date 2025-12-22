import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, city, device_id } = body;

        if (!name || !device_id) {
            return NextResponse.json({ error: 'College name and Device ID are required' }, { status: 400 });
        }

        // 1. Generate unique college ID
        const collegeId = `clg-${uuidv4().substring(0, 8)}`;

        // 2. Insert into colleges table as VERIFIED
        await sql`
            INSERT INTO colleges (id, name, city, status, created_by)
            VALUES (${collegeId}, ${name}, ${city || 'Unknown'}, 'VERIFIED', ${device_id})
        `;

        // 3. Update the user who suggested it to automatically "Join" this college
        // This ensures they are immediately available for the user who created them.
        await sql`
            UPDATE users 
            SET college_id = ${collegeId}
            WHERE device_id = ${device_id}
        `;

        return NextResponse.json({
            success: true,
            college_id: collegeId,
            message: 'College created successfully! You have been joined to it.'
        });

    } catch (error: any) {
        console.error('Create College Error:', error);
        return NextResponse.json({ error: 'Failed to suggest college: ' + error.message }, { status: 500 });
    }
}
