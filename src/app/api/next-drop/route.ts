import { NextRequest, NextResponse } from 'next/server';
import { calculateNextDrop } from '@/lib/utils';

export async function GET(req: NextRequest) {
    try {
        const nextDrop = calculateNextDrop();
        const now = new Date();
        const msRemaining = nextDrop.getTime() - now.getTime();

        return NextResponse.json({
            nextDropTime: nextDrop.toISOString(),
            msRemaining,
            secondsRemaining: Math.floor(msRemaining / 1000)
        });

    } catch (error) {
        console.error('Next Drop Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
