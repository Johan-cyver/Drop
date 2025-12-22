import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const confessionId = params.id;

        const messagesRes = await sql`
            SELECT id, device_id, handle, avatar, content, created_at 
            FROM messages 
            WHERE confession_id = ${confessionId}
            ORDER BY created_at ASC
            LIMIT 50
        `;

        return NextResponse.json(messagesRes.rows);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const confessionId = params.id;
        const { device_id, handle, avatar, content } = await req.json();

        if (!content || !device_id) {
            return NextResponse.json({ error: 'Missing logic' }, { status: 400 });
        }

        const msgRes = await sql`
            INSERT INTO messages (confession_id, device_id, handle, avatar, content)
            VALUES (${confessionId}, ${device_id}, ${handle || 'Guest'}, ${avatar || 'ghost'}, ${content})
            RETURNING *
        `;

        return NextResponse.json(msgRes.rows[0]);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
