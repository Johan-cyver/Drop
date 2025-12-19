import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NEXT_DROP_TIMES, DROP_LIFESPAN, DROP_ACTIVE_WINDOW } from './constants';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

export function formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// Calculate next "Next Drop" sync time
export function calculateNextDrop(): Date {
    const now = new Date();
    const currentHour = now.getHours();

    // Find next drop time
    let nextDropHour = NEXT_DROP_TIMES.find(h => h > currentHour);

    if (nextDropHour === undefined) {
        // If no more drops today, get first drop tomorrow
        nextDropHour = NEXT_DROP_TIMES[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(nextDropHour, 0, 0, 0);
        return tomorrow;
    }

    const nextDrop = new Date(now);
    nextDrop.setHours(nextDropHour, 0, 0, 0);
    return nextDrop;
}

// Format countdown timer (e.g., "2h 34m" or "45m" or "12s")
export function formatCountdown(ms: number): string {
    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

// Check if a post is in DROP_ACTIVE state
export function isDropActive(post: { drop_active_at?: string; expires_at?: string }): boolean {
    if (!post.drop_active_at || !post.expires_at) return false;

    const now = new Date().getTime();
    const dropActiveTime = new Date(post.drop_active_at).getTime();
    const expiryTime = new Date(post.expires_at).getTime();

    return now >= dropActiveTime && now < expiryTime;
}

// Check if a post has expired
export function isExpired(post: { expires_at?: string }): boolean {
    if (!post.expires_at) return false;
    return new Date().getTime() >= new Date(post.expires_at).getTime();
}

// Get time remaining until expiry
export function getTimeRemaining(timestamp: string): number {
    return new Date(timestamp).getTime() - new Date().getTime();
}

// Calculate expiry and drop_active timestamps for new posts
export function calculateTemporalTimestamps(createdAt: Date = new Date()) {
    const expiresAt = new Date(createdAt.getTime() + DROP_LIFESPAN);
    const dropActiveAt = new Date(expiresAt.getTime() - DROP_ACTIVE_WINDOW);

    return {
        expires_at: expiresAt.toISOString(),
        drop_active_at: dropActiveAt.toISOString()
    };
}

