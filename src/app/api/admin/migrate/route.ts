import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // Security Gate
        const auth = req.headers.get('x-admin-secret');
        const secret = process.env.ADMIN_SECRET || 'drop_admin_2024';

        if (auth !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }

        // Migrate existing users to DSU
        // Only update users who don't have a college or have 'unknown' as college
        const result = await sql`
            UPDATE users 
            SET college_id = 'dsu' 
            WHERE college_id IS NULL 
               OR college_id = '' 
               OR college_id = 'unknown'
            RETURNING device_id, handle
        `;

        return NextResponse.json({
            success: true,
            migrated_count: result.rowCount,
            migrated_users: result.rows,
            message: `Successfully migrated ${result.rowCount} users to Dayananda Sagar University`
        });

    } catch (error: any) {
        console.error('Migration Error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error.message
        }, { status: 500 });
    }
}
