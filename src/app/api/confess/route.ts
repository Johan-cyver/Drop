import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { content, device_id, image, is_shadow, is_open, unlock_threshold } = body;

        if (!content || !device_id) {
            return NextResponse.json({ error: 'Missing content or likely device_id' }, { status: 400 });
        }

        // 1. Data Prep for Timestamps
        const now = new Date();
        const DROP_LIFESPAN = 24 * 60 * 60 * 1000; // 24 hours
        const expires_at = new Date(now.getTime() + DROP_LIFESPAN).toISOString();
        const drop_active_at = now.toISOString();

        // 2. Rate Limit Check
        const lastPostRes = await query(`
            SELECT created_at FROM confessions 
            WHERE device_id = $1 
            ORDER BY created_at DESC 
            LIMIT 1
        `, [device_id]);
        const lastPost = lastPostRes.rows[0];

        if (lastPost) {
            const lastTime = new Date(lastPost.created_at).getTime();
            const diff = Date.now() - lastTime;
            if (diff < 5 * 1000) {
                return NextResponse.json({ error: 'You are doing that too much. Chill.' }, { status: 429 });
            }
        }

        // 3. User & College Check
        const userRes = await query(`SELECT college_id, shadow_banned FROM users WHERE device_id = $1`, [device_id]);
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
        const finalThreshold = is_shadow ? (unlock_threshold || 5) : 0;
        const teaseMode = body.tease_mode || 'none';
        let teaseContent = null;

        if (is_shadow) {
            if (teaseMode === '3_words') {
                teaseContent = content.split(' ').slice(0, 3).join(' ') + '...';
            } else if (teaseMode === '1_sentence') {
                teaseContent = content.split(/[.!?]/)[0] + '...';
            }
        }

        await query(`
            INSERT INTO confessions(
                id, content, college_id, device_id, status, tag, public_id,
                expires_at, drop_active_at, created_at, image,
                is_shadow, is_open, unlock_votes, unlock_threshold, tease_content
            )
            VALUES(
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11,
                $12, $13, 0, $14, $15
            )
        `, [
            id, content, user.college_id, device_id, status, tag, publicId,
            expires_at, drop_active_at, now.toISOString(), image || null,
            is_shadow || false, is_open || false, finalThreshold, teaseContent
        ]);

        // 6. Update User Stats (10 Impact = 1000 Coins)
        await query(`UPDATE users SET last_post_at = $1, impact = impact + 10, coins = coins + 1000 WHERE device_id = $2`, [now.toISOString(), device_id]);

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
