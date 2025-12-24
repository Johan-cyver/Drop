import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// In-memory cache for tracking active users
const activeUsers = new Map<string, Set<string>>(); // confession_id -> Set of device_ids

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }
        const confessionId = params.id;
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('device_id');

        // Track this user as active
        if (deviceId) {
            if (!activeUsers.has(confessionId)) {
                activeUsers.set(confessionId, new Set());
            }
            activeUsers.get(confessionId)!.add(deviceId);

            // Clean up old entries periodically (users inactive for > 60 seconds)
            setTimeout(() => {
                const users = activeUsers.get(confessionId);
                if (users) {
                    users.delete(deviceId);
                    if (users.size === 0) {
                        activeUsers.delete(confessionId);
                    }
                }
            }, 60000); // 60 seconds
        }

        // Return count of online users
        const onlineCount = activeUsers.get(confessionId)?.size || 0;

        return NextResponse.json({ onlineCount });
    } catch (err: any) {
        console.error('Online Users Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
