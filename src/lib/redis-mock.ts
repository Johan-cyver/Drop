// Simulates an in-memory Redis buffer for high-velocity counters
// In a real app, this would be actual Redis

type VoteBuffer = Map<string, number>; // confession_id -> delta

class RedisMock {
    private voteBuffer: VoteBuffer = new Map();
    private flushInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Auto-flush every 10 seconds (Simulating the worker)
        if (!this.flushInterval) {
            this.flushInterval = setInterval(() => this.flush(), 10000);
        }
    }

    public increment(confessionId: string, amount: number) {
        const current = this.voteBuffer.get(confessionId) || 0;
        this.voteBuffer.set(confessionId, current + amount);
    }

    private flush() {
        if (this.voteBuffer.size > 0) {
            console.log('Flushing vote buffer to DB...', this.voteBuffer);
            this.voteBuffer.clear();
        }
    }

    // Flush to DB (Simulated Worker)
    // In our SQLite version, we can just return the buffer for the API to process if needed,
    // or typically this "Redis" class would have the DB instance injected.
    // For simplicity in this Serverless/API Route env, we will let the API route handle the "flush" 
    // or direct write if the buffer gets too big, OR properly, we just write to DB directly 
    // but this class represents the "Optimistic" state for the client.

    // Actually, for this local demo, let's keep it simple:
    // This class mostly serves to track "Active Viewers" or something ephemeral if we wanted.
    // For Votes, we will write to SQLite directly but Use this class to "debounce" if we had high load.

    // Changing Strategy for Local Demo:
    // We will just write to SQLite directly for simplicity, but I will keep this file 
    // as a placeholder for where the Redis logic belongs described in the architecture.

    public getPendingVotes(confessionId: string): number {
        return this.voteBuffer.get(confessionId) || 0;
    }
}

// Global instance to persist across HMR in dev
const globalForRedis = global as unknown as { redis: RedisMock };
const redis = globalForRedis.redis || new RedisMock();
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
