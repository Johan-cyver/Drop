import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }
        const confessionId = params.id;

        // Return messages with reply data
        const messagesRes = await sql`
            SELECT 
                m.id, 
                m.device_id, 
                m.handle, 
                m.avatar, 
                m.content, 
                m.created_at,
                m.reply_to_id,
                r.handle as reply_to_handle,
                r.content as reply_to_content
            FROM messages m
            LEFT JOIN messages r ON m.reply_to_id = r.id
            WHERE m.confession_id = ${confessionId}
            ORDER BY m.created_at ASC
            LIMIT 100
        `;

        return NextResponse.json(messagesRes.rows);
    } catch (err: any) {
        console.error('Chat GET Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }
        const confessionId = params.id;
        const { device_id, handle, avatar, content, reply_to_id } = await req.json();

        if (!content || !device_id) {
            return NextResponse.json({ error: 'Missing content or device_id' }, { status: 400 });
        }

        const msgRes = await sql`
            INSERT INTO messages (confession_id, device_id, handle, avatar, content, reply_to_id)
            VALUES (${confessionId}, ${device_id}, ${handle || 'Guest'}, ${avatar || 'ghost'}, ${content}, ${reply_to_id || null})
            RETURNING *
        `;

        return NextResponse.json(msgRes.rows[0]);
    } catch (err: any) {
        console.error('Chat POST Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
