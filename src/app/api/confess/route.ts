import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';
import { calculateTemporalTimestamps } from '@/lib/utils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { content, device_id } = body;

        if (!content || !device_id) {
            return NextResponse.json({ error: 'Missing content or likely device_id' }, { status: 400 });
        }

        // 1. Data Prep for Timestamps
        // We use JS Date to be DB-agnostic for calculations, then save as ISO string or timestamp
        const now = new Date();
        const { expires_at, drop_active_at } = calculateTemporalTimestamps(now);

        // 2. Rate Limit Check (Postgres)
        // Check if user posted in last 2 hours (Cooldown) 
        // Or 5 seconds for testing
        const lastPostRes = await sql`
            SELECT created_at FROM confessions 
            WHERE device_id = ${device_id} 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const lastPost = lastPostRes.rows[0];

        if (lastPost) {
            // Postgres returns date object for timestamp columns usually
            const lastTime = new Date(lastPost.created_at).getTime();
            const diff = Date.now() - lastTime;

            // Testing limit: 5 seconds. Prod: 2 hours (commented out)
            // if (diff < 2 * 60 * 60 * 1000) return error...
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
        const blacklist = ['kill', 'bomb', 'suicide'];
        if (blacklist.some(w => content.toLowerCase().includes(w))) {
            status = 'FLAGGED';
        }

        const tagMatch = content.match(/#[\w]+/);
        const tag = tagMatch ? tagMatch[0] : null;
        const publicId = `Drop-${randomUUID().slice(0, 5)}`;

        // 5. Transactional Insert (User Update + Post Insert)
        // Vercel Postgres doesn't support complex transactions easily in one go with template literals
        // But we can just run them sequentially. If one fails, it's rare enough for MVP.

        // A. Insert Post
        await sql`
            INSERT INTO confessions (
                id, content, college_id, device_id, status, tag, public_id, 
                expires_at, drop_active_at, created_at
            )
            VALUES (
                ${id}, ${content}, ${user.college_id}, ${device_id}, ${status}, ${tag}, ${publicId},
                ${expires_at}, ${drop_active_at}, ${now.toISOString()}
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
            return NextResponse.json({ error: 'Your confession has been flagged for review.' }, { status: 403 });
        }

        return NextResponse.json({ success: true, id }, { status: 201 });

    } catch (error) {
        console.error('Confess Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
