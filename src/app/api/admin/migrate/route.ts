import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // Security Gate
        const auth = req.headers.get('x-admin-secret');
        const secret = process.env.ADMIN_SECRET || 'drop_admin_2024';

        if (auth !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Migrate existing users to DSU
        // Update users who don't have a college, have 'unknown' or 'eee' as college
        const result = await query(`
            UPDATE users 
            SET college_id = 'dsu' 
            WHERE college_id IS NULL 
               OR college_id = '' 
               OR LOWER(college_id) = 'unknown'
               OR LOWER(college_id) = 'eee'
            RETURNING device_id, handle
        `);

        return NextResponse.json({
            success: true,
            migrated_count: result.rows.length,
            migrated_users: result.rows,
            message: `Successfully migrated ${result.rows.length} users to Dayananda Sagar University (dsu)`
        });

    } catch (error: any) {
        console.error('Migration Error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error.message
        }, { status: 500 });
    }
}
