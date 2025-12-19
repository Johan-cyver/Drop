import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch all feedback, most recent first
        const feedbackRes = await sql`
            SELECT id, device_id, message, created_at
            FROM feedback
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ feedback: feedbackRes.rows });

    } catch (error) {
        console.error('Feedback Admin Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
