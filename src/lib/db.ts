import { sql } from '@vercel/postgres';

// Vercel Postgres is serverless and async by default.
// We export the query helper to use in our routes.

// Helper for database connection string
const getPostgresUrl = () => {
    return process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.NEON_DATABASE_URL;
};

export async function query(text: string, params: any[] = []) {
    // Check if we have any valid connection string
    const url = getPostgresUrl();

    if (!url) {
        throw new Error('DATABASE_NOT_CONNECTED');
    }

    try {
        return await sql.query(text, params);
    } catch (error) {
        console.error('Database Error:', error);
        throw error;
    }
}

// For operations requiring a raw client (transactions)
export { sql };

export interface Confession {
    id: string;
    public_id: string;
    content: string;
    college_id: string;
    device_id: string;
    upvotes: number;
    downvotes: number;
    status: 'LIVE' | 'REJECTED' | 'FLAGGED';
    tag: string | null;
    expires_at: string;
    drop_active_at: string | null;
    created_at: string;
    // UI Extras
    myVote?: number;
    hotScore?: number;
    velocity?: string | null;
    handle?: string;
    avatar?: string;
}

export interface User {
    device_id: string;
    handle: string | null;
    name: string | null;
    pin_hash: string | null;
    avatar: string | null;
    college_id: string;
    coins: number;
    shadow_banned: boolean;
    created_at: string;
}
