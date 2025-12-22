import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import { calculateTemporalTimestamps } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected (POSTGRES_URL missing)' }, { status: 500 });
        }

        const body = await req.json();
        const { content, device_id, image, is_shadow, is_open } = body;

        if (!content || !device_id) {
            return NextResponse.json({ error: 'Missing content or likely device_id' }, { status: 400 });
        }

        // 1. Data Prep for Timestamps
        const now = new Date();
        const { expires_at, drop_active_at } = calculateTemporalTimestamps(now);

        // 2. Rate Limit Check (Postgres)
        const lastPostRes = await sql`
            SELECT created_at FROM confessions 
            WHERE device_id = ${device_id} 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const lastPost = lastPostRes.rows[0];

        if (lastPost) {
            const lastTime = new Date(lastPost.created_at).getTime();
            const diff = Date.now() - lastTime;
            // Testing limit: 5 seconds.
            if (diff < 5 * 1000) {
                return NextResponse.json({ error: 'You are doing that too much. Chill.' }, { status: 429 });
            }
        }

        // 3. User & College Check
        const userRes = await sql`SELECT college_id, shadow_banned FROM users WHERE device_id = ${device_id}`;
        const user = userRes.rows[0];

        if (!user || !user.college_id) {
            return NextResponse.json({ error: 'You must join a college first.' }, { status: 403 });
        }

        if (user.shadow_banned) {
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }

        // 4. Prepare Insert (Status & Tags)
        const id = randomUUID();
        let status = 'LIVE';
        const blacklist = ['kill', 'bomb', 'terrorist'];
        const crisisWords = ['suicide', 'self-harm', 'end my life', 'depressed', 'help me', 'worthless', 'giving up'];

        const contentLower = content.toLowerCase();
        let safetyWarning = false;

        if (blacklist.some(w => contentLower.includes(w))) {
            status = 'FLAGGED';
        }

        if (crisisWords.some(w => contentLower.includes(w))) {
            safetyWarning = true;
        }

        const tagMatch = content.match(/#[\w]+/);
        const tag = tagMatch ? tagMatch[0] : null;
        const publicId = `Drop-${randomUUID().slice(0, 5)}`;

        // 5. Transactional Insert
        // A. Insert Post
        const unlockVotes = is_shadow ? 5 : 0;

        await sql`
            INSERT INTO confessions(
                id, content, college_id, device_id, status, tag, public_id,
                expires_at, drop_active_at, created_at, image,
                is_shadow, is_open, unlock_votes
            )
            VALUES(
                ${id}, ${content}, ${user.college_id}, ${device_id}, ${status}, ${tag}, ${publicId},
                ${expires_at}, ${drop_active_at}, ${now.toISOString()}, ${image || null},
                ${is_shadow || false}, true, ${unlockVotes}
            )
        `;

        // B. Update User Last Post
        await sql`
            UPDATE users SET last_post_at = ${now.toISOString()} WHERE device_id = ${device_id}
        `;

        // C. Update Karma (Coins) - Reward for posting
        await sql`
            UPDATE users SET coins = coins + 10 WHERE device_id = ${device_id}
        `;

        if (status === 'FLAGGED') {
            return NextResponse.json({
                error: 'Your confession has been flagged for review.',
                safety_warning: safetyWarning
            }, { status: 403 });
        }

        return NextResponse.json({ success: true, id, safety_warning: safetyWarning }, { status: 201 });

    } catch (error: any) {
        console.error('Confess API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
