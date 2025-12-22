import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { confession_id, emoji, device_id } = await req.json();

        if (!confession_id || !emoji || !device_id) {
            return NextResponse.json({ error: 'Missing logic' }, { status: 400 });
        }

        // Toggle Reaction
        const existing = await sql`
            SELECT id FROM reactions 
            WHERE confession_id = ${confession_id} 
              AND device_id = ${device_id} 
              AND emoji = ${emoji}
        `;

        if (existing.rows.length > 0) {
            await sql`
                DELETE FROM reactions 
                WHERE confession_id = ${confession_id} 
                  AND device_id = ${device_id} 
                  AND emoji = ${emoji}
            `;
            return NextResponse.json({ success: true, action: 'removed' });
        } else {
            await sql`
                INSERT INTO reactions (confession_id, device_id, emoji)
                VALUES (${confession_id}, ${device_id}, ${emoji})
            `;
            return NextResponse.json({ success: true, action: 'added' });
        }

    } catch (err: any) {
        console.error('Reaction API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
