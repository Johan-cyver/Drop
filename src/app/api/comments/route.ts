import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { confession_id, content, device_id, parent_id } = body;

        if (!confession_id || !content || !device_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if user is banned
        const userRes = await sql`
            SELECT shadow_banned FROM users WHERE device_id = ${device_id}
        `;
        const user = userRes.rows[0];

        if (user?.shadow_banned) {
            return NextResponse.json({ error: 'Access restricted' }, { status: 403 });
        }

        // 2. Insert Comment
        const commentRes = await sql`
            INSERT INTO comments (confession_id, device_id, content, parent_id)
            VALUES (${confession_id}, ${device_id}, ${content}, ${parent_id || null})
            RETURNING *
        `;

        const newComment = commentRes.rows[0];

        // 3. (Optional) Could trigger a notification here in the future

        return NextResponse.json(newComment);

    } catch (error) {
        console.error('Post Comment Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
