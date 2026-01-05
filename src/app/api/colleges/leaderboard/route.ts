import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const res = await query(`
            SELECT 
                c.id, c.name, 
                (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id) as student_count,
                (SELECT SUM(coins) FROM users u WHERE u.college_id = c.id) as total_wealth,
                (SELECT COUNT(*) FROM confessions conf WHERE conf.college_id = c.id) as post_count
            FROM colleges c
            ORDER BY total_wealth DESC NULLS LAST
            LIMIT 5
        `);

        return NextResponse.json(res.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
