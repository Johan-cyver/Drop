import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const vars = {
        POSTGRES_URL: process.env.POSTGRES_URL ? 'PRESENT (starts with ' + process.env.POSTGRES_URL.slice(0, 10) + '...)' : 'MISSING',
        VERCEL_ENV: process.env.VERCEL_ENV || 'LOCAL?',
        NODE_ENV: process.env.NODE_ENV
    };

    return NextResponse.json(vars);
}
