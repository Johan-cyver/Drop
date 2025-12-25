import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { confession_id, emoji, device_id } = await req.json();

        if (!confession_id || !emoji || !device_id) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Check if reaction already exists
        const existing = await query(`
            SELECT id FROM reactions 
            WHERE confession_id = $1 AND device_id = $2 AND emoji = $3
        `, [confession_id, device_id, emoji]);

        if (existing.rows.length > 0) {
            // Remove it (toggle off)
            await query(`
                DELETE FROM reactions 
                WHERE confession_id = $1 AND device_id = $2 AND emoji = $3
            `, [confession_id, device_id, emoji]);
            return NextResponse.json({ success: true, active: false });
        } else {
            // Add it
            await query(`
                INSERT INTO reactions (confession_id, device_id, emoji)
                VALUES ($1, $2, $3)
            `, [confession_id, device_id, emoji]);

            // Award "Impact Coin" (one-time per user-post-emoji trio)
            const authorRes = await query(`SELECT device_id FROM confessions WHERE id = $1`, [confession_id]);
            const authorId = authorRes.rows[0]?.device_id;

            if (authorId && authorId !== device_id) {
                const actionType = `REACTION_${emoji}`;
                const alreadyAwarded = await query(
                    `SELECT 1 FROM reward_tracking WHERE confession_id = $1 AND device_id = $2 AND action_type = $3`,
                    [confession_id, device_id, actionType]
                );

                if (alreadyAwarded.rows.length === 0) {
                    await query(`UPDATE users SET coins = coins + 1 WHERE device_id = $1`, [authorId]);
                    await query(
                        `INSERT INTO reward_tracking (confession_id, device_id, action_type) VALUES ($1, $2, $3)`,
                        [confession_id, device_id, actionType]
                    );
                }
            }

            return NextResponse.json({ success: true, active: true });
        }

    } catch (error: any) {
        console.error('Reaction Error:', error);
        return NextResponse.json({ error: 'REACTION_FAILED', message: error.message }, { status: 500 });
    }
}
