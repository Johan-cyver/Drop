import { sql, createPool, VercelPool } from '@vercel/postgres';

// Singleton pool instance
let pool: VercelPool | null = null;

// Helper for database connection string
const getPostgresUrl = () => {
    return process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.NEON_DATABASE_URL;
};

// Create or return existing pool
const getPool = () => {
    if (pool) return pool;
    const url = getPostgresUrl();
    if (!url) throw new Error('DATABASE_NOT_CONNECTED');

    pool = createPool({ connectionString: url });
    return pool;
};

// Create a safe query wrapper
export async function query(text: string, params: any[] = []) {
    try {
        const activePool = getPool();
        return await activePool.query(text, params);
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
