import { Confession } from './db';

// The Hook Algorithm v2 "Alive"
// Score = (Upvotes * 2 + Comments * 3) / (Hours + 2)^1.3

export function calculateHotScore(post: Confession): number {
    const now = new Date();
    const posted = new Date(post.created_at);

    // 1. Calculate weighted interactions (Comments = 0 for now)
    const votes = post.upvotes - post.downvotes;
    const interactions = (votes * 2) + 0;

    // 2. Calculate Time Decay in Hours
    const diffMs = now.getTime() - posted.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // 3. Gravity Consant (1.3 is gentler than 1.8, keeps things alive longer)
    const gravity = 1.3;

    // 4. Formula
    // Add 2 to hours to prevent massive scores for fresh posts (standard Reddit/HN tweak)
    return interactions / Math.pow(diffHours + 2, gravity);
}

export function getVelocityString(post: Confession): string | null {
    // Simulation: If trending, show a velocity specific to its heat
    // In a real app, this would query the `votes` table for `created_at > 10 mins ago`
    // Here we fake it nicely for the demo feel based on total votes and age.

    // Only show for posts < 24 hours old with > 5 votes
    const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24 || post.upvotes < 5) return null;

    // Fake distinct velocities
    if (post.upvotes > 20) return `+${Math.ceil(post.upvotes / 4)} reactions in last 10 min`;
    if (post.upvotes > 10) return `+${Math.ceil(post.upvotes / 2)} people agree recently`;

    return null;
}

// Partition Feed into "Hot" and "New"
export function rankFeed(posts: Confession[], ratio: number = 0.4) {
    // 1. Calculate Score for all
    const scored = posts.map(p => ({
        ...p,
        hotScore: calculateHotScore(p),
        velocity: getVelocityString(p)
    }));

    // 2. Sort by Hot Score
    const byHot = [...scored].sort((a, b) => b.hotScore - a.hotScore);

    // 3. Sort by New
    const byNew = [...scored].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 4. Selection (Deduplicated)
    const hotCount = Math.floor(posts.length * ratio);

    const hotLane = byHot.slice(0, hotCount);
    const hotIds = new Set(hotLane.map(h => h.id));

    const newLane = byNew.filter(p => !hotIds.has(p.id));

    // 5. Interleave for the "Feed Mix"
    // We want: Hot, Hot, New, Hot, New, New...
    // For now, let's just return a single merged list: Hot first (Hook), then New (Discovery)
    // Or randomly intersperse to keep it "Fresh"

    return {
        hot: hotLane,
        new: newLane,
        // Combined feed logic: Top 3 Hot, then mix
        feed: [...hotLane.slice(0, 3), ...newLane, ...hotLane.slice(3)]
    };
}
