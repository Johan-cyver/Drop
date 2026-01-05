import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { confession_id, option_index, device_id } = body;

        if (!confession_id || option_index === undefined || !device_id) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Check if already voted
        const check = await query(
            `SELECT id FROM reward_tracking WHERE confession_id = $1 AND device_id = $2 AND action_type = 'poll_vote'`,
            [confession_id, device_id]
        );

        if (check.rows.length > 0) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
        }

        // 2. Fetch current votes
        const postRes = await query(`SELECT poll_votes FROM confessions WHERE id = $1`, [confession_id]);
        if (postRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let pollVotes = postRes.rows[0].poll_votes || {};
        if (typeof pollVotes === 'string') pollVotes = JSON.parse(pollVotes);

        pollVotes[option_index] = (pollVotes[option_index] || 0) + 1;

        // 3. Update votes
        await query(
            `UPDATE confessions SET poll_votes = $1 WHERE id = $2`,
            [JSON.stringify(pollVotes), confession_id]
        );

        // 4. Track reward (20 Coins = 0.2 Impact for poll vote)
        await query(
            `INSERT INTO reward_tracking (confession_id, device_id, action_type) VALUES ($1, $2, 'poll_vote')`,
            [confession_id, device_id]
        );

        // 5. Award Coins
        await query(
            `UPDATE users SET impact = impact + 0.2, coins = coins + 20 WHERE device_id = $1`,
            [device_id]
        );

        return NextResponse.json({ success: true, poll_votes: pollVotes });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
