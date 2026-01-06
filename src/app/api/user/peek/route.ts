import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { confession_id, device_id, word_index } = await req.json();
        const PEEK_COST = 100; // Increased to 100 for word-by-word
        const AUTHOR_REWARD = 67;

        if (!confession_id || !device_id) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 1. Check if already peeked this specific word (or the whole post)
        const existing = await query(
            `SELECT word_index FROM peeks WHERE device_id = $1 AND confession_id = $2`,
            [device_id, confession_id]
        );

        const alreadyPeekedWords = existing.rows.map(r => r.word_index); // null means "Peek All"
        if (alreadyPeekedWords.includes(word_index) || alreadyPeekedWords.includes(null)) {
            return NextResponse.json({ success: true, already: true });
        }

        // 2. Check balance
        const userRes = await query(`SELECT coins FROM users WHERE device_id = $1`, [device_id]);
        const coins = userRes.rows[0]?.coins || 0;

        if (coins < PEEK_COST) {
            return NextResponse.json({ error: 'Insufficent Drop Coins' }, { status: 403 });
        }

        // 3. Get Author ID
        const postRes = await query(`SELECT device_id FROM confessions WHERE id = $1`, [confession_id]);
        const authorId = postRes.rows[0]?.device_id;

        // 4. Transactional Updates
        // Deduct from viewer
        await query(`UPDATE users SET coins = coins - $1 WHERE device_id = $2`, [PEEK_COST, device_id]);

        // Reward author
        if (authorId && authorId !== device_id) {
            await query(`UPDATE users SET coins = coins + $1 WHERE device_id = $2`, [AUTHOR_REWARD, authorId]);
        }

        // Record Peek (with word_index)
        await query(`INSERT INTO peeks (device_id, confession_id, word_index) VALUES ($1, $2, $3)`, [device_id, confession_id, word_index ?? null]);

        // 5. Return the revealed word if requested
        let revealedWord = null;
        if (word_index !== undefined && word_index !== null) {
            const contentRes = await query(`SELECT content FROM confessions WHERE id = $1`, [confession_id]);
            const fullContent = contentRes.rows[0]?.content || "";
            const words = fullContent.split(/\s+/);
            revealedWord = words[word_index] || "";
        }

        return NextResponse.json({
            success: true,
            word: revealedWord
        });

    } catch (error: any) {
        console.error('Peek Error:', error);
        return NextResponse.json({ error: 'PEEK_FAILED', message: error.message }, { status: 500 });
    }
}
