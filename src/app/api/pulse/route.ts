import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { device_id, college_id, viewing_confession_id, is_typing } = await req.json();

        if (!device_id) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });

        await query(`
            INSERT INTO activity_sessions (device_id, college_id, viewing_confession_id, is_typing, last_active_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (device_id) 
            DO UPDATE SET 
                college_id = EXCLUDED.college_id,
                viewing_confession_id = EXCLUDED.viewing_confession_id,
                is_typing = EXCLUDED.is_typing,
                last_active_at = NOW()
        `, [device_id, college_id || null, viewing_confession_id || null, is_typing || false]);

        // Get counts for the college
        const collegeCountRes = await query(
            `SELECT COUNT(*) FROM activity_sessions WHERE college_id = $1 AND last_active_at > NOW() - INTERVAL '1 minute'`,
            [college_id]
        );

        // Get counts for the specific post
        let viewers = 0;
        let typers = 0;
        if (viewing_confession_id) {
            const postRes = await query(
                `SELECT 
                    COUNT(*) as viewers,
                    SUM(CASE WHEN is_typing THEN 1 ELSE 0 END) as typers
                 FROM activity_sessions 
                 WHERE viewing_confession_id = $1 AND last_active_at > NOW() - INTERVAL '1 minute'`,
                [viewing_confession_id]
            );
            viewers = parseInt(postRes.rows[0].viewers || '0');
            typers = parseInt(postRes.rows[0].typers || '0');
        }

        return NextResponse.json({
            college_online: parseInt(collegeCountRes.rows[0].count || '0'),
            post_viewers: viewers,
            post_typers: typers
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
