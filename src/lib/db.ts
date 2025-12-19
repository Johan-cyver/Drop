import { sql } from '@vercel/postgres';

// Vercel Postgres is serverless and async by default.
// We export the query helper to use in our routes.

export async function query(text: string, params: any[] = []) {
    try {
        return await sql.query(text, params);
    } catch (error) {
        console.error('Database Error:', error);
        throw error;
    }
}

// For operations requiring a raw client (transactions)
export { sql };
