import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected (POSTGRES_URL missing)' }, { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        let colleges;
        if (query) {
            const res = await sql`
                SELECT id, name, city, status 
                FROM colleges 
                WHERE (name ILIKE ${'%' + query + '%'} OR city ILIKE ${'%' + query + '%'})
                ORDER BY name ASC 
                LIMIT 20
            `;
            colleges = res.rows;
        } else {
            const res = await sql`
                SELECT id, name, city, status 
                FROM colleges 
                ORDER BY name ASC 
                LIMIT 50
            `;
            colleges = res.rows;
        }

        return NextResponse.json({ colleges });
    } catch (error) {
        console.error('Colleges API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
