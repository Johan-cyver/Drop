import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';
import { MAX_FEEDBACK_LENGTH } from '@/lib/constants';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { device_id, message } = body;

        if (!device_id || !message) {
            return NextResponse.json({ error: 'Missing device_id or message' }, { status: 400 });
        }

        // Validate message length
        if (message.length > MAX_FEEDBACK_LENGTH) {
            return NextResponse.json({
                error: `Feedback too long. Max ${MAX_FEEDBACK_LENGTH} characters.`
            }, { status: 400 });
        }

        // Insert feedback
        const id = randomUUID();
        await sql`
            INSERT INTO feedback (id, device_id, message)
            VALUES (${id}, ${device_id}, ${message})
        `;

        return NextResponse.json({ success: true, id }, { status: 201 });

    } catch (error) {
        console.error('Feedback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
