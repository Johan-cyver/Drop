import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { confession_id, content, device_id, parent_id } = body;

        if (!confession_id || !content || !device_id) {
            console.error('Comment Field Validation Failed:', {
                has_confession_id: !!confession_id,
                has_content: !!content,
                has_device_id: !!device_id,
                confession_id,
                device_id
            });
            return NextResponse.json({ error: 'Missing required fields: confession_id, content, or device_id' }, { status: 400 });
        }

        // 1. Check if user is banned
        const userRes = await query(`
            SELECT shadow_banned FROM users WHERE device_id = $1
        `, [device_id]);
        const user = userRes.rows[0];

        if (user?.shadow_banned) {
            return NextResponse.json({ error: 'Access restricted' }, { status: 403 });
        }

        // 2. Insert Comment
        const commentRes = await query(`
            INSERT INTO comments (confession_id, device_id, content, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [confession_id, device_id, content, parent_id || null]);

        const newComment = commentRes.rows[0];

        return NextResponse.json(newComment);

    } catch (error: any) {
        console.error('Post Comment Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
