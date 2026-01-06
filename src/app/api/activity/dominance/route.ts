import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Calculate dominance based on post count in the last 24 hours
        const statsRes = await query(`
            SELECT 
                c.id, 
                c.name, 
                COUNT(conf.id) as drop_count
            FROM colleges c
            LEFT JOIN confessions conf ON conf.college_id = c.id 
                AND conf.created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY c.id, c.name
            ORDER BY drop_count DESC
        `);

        const totalDrops = statsRes.rows.reduce((acc: number, row: any) => acc + parseInt(row.drop_count), 0);

        const collegeStats = statsRes.rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            count: parseInt(row.drop_count),
            percentage: totalDrops > 0 ? (parseInt(row.drop_count) / totalDrops) * 100 : 0
        }));

        return NextResponse.json({
            dominance: collegeStats,
            topDog: collegeStats[0],
            totalDrops
        });

    } catch (error: any) {
        console.error('Dominance API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
