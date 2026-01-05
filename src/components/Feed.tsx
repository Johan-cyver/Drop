'use client';
import { useState, useEffect } from 'react';
import ConfessionCard, { Post } from './ConfessionCard';
import { Timer } from 'lucide-react';
import { calculateNextDrop, formatCountdown } from '@/lib/utils';

export default function Feed({
    posts,
    onVote,
    colleges = [],
    selectedCollegeId,
    onCollegeChange,
    userCollegeId,
    hideIdentity = true
}: {
    posts: Post[],
    onVote: (id: string, val: number) => void,
    colleges?: any[],
    selectedCollegeId?: string | null,
    onCollegeChange?: (id: string) => void,
    userCollegeId?: string | null,
    hideIdentity?: boolean
}) {
    const [filter, setFilter] = useState<'new' | 'hot'>('new');
    const [nextDropCountdown, setNextDropCountdown] = useState('');

    // Update Next Drop countdown every second
    useEffect(() => {
        const updateCountdown = () => {
            const nextDrop = calculateNextDrop();
            const msRemaining = nextDrop.getTime() - Date.now();
            setNextDropCountdown(formatCountdown(msRemaining));
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const sortedPosts = [...posts].filter(p => true).sort((a, b) => {
        if (filter === 'hot') return b.upvotes - a.upvotes;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <main className="flex-1 lg:col-span-6 w-full max-w-[480px] lg:max-w-none mx-auto flex flex-col h-full bg-dark-950/50 lg:bg-transparent lg:border-x lg:border-white/5 relative shadow-2xl lg:shadow-none">

            {/* Mobile Header (Hidden on Laptop) */}
            <header className="lg:hidden glass-panel sticky top-0 z-30 px-6 py-4 flex flex-col gap-4 border-b border-white/5 bg-dark-950/80 backdrop-blur-3xl">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-brand-glow rounded-full shadow-[0_0_15px_rgba(139,92,246,0.8)] animate-pulse" />
                            <div className="absolute inset-0 bg-brand-glow rounded-full animate-ping opacity-30" />
                        </div>
                        <h1 className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">The Drop</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
                        <span className="text-[10px] font-bold text-brand-glow tracking-widest">{nextDropCountdown}</span>
                        <Timer className="w-3 h-3 text-gray-400" />
                    </div>
                </div>

                {/* Integrated Filter Tabs in Header for cleanliness */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                    <button
                        onClick={() => setFilter('new')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 relative z-10 ${filter === 'new' ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Fresh
                        {filter === 'new' && <div className="absolute inset-0 bg-white/10 rounded-lg -z-10 border border-white/5" />}
                    </button>
                    <button
                        onClick={() => setFilter('hot')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 relative z-10 ${filter === 'hot' ? 'text-brand-glow shadow-lg shadow-brand-glow/10' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Burning 🔥
                        {filter === 'hot' && <div className="absolute inset-0 bg-brand-glow/10 rounded-lg -z-10 border border-brand-glow/20" />}
                    </button>
                </div>
            </header>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto lg:overflow-visible pb-24 pt-2 lg:pt-8" id="scroller">

                {/* Desktop Header */}
                <div className="hidden lg:flex flex-col gap-4 px-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold uppercase tracking-widest">CONFESSION</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFilter('new')}
                                className={`font-bold transition ${filter === 'new' ? 'text-white' : 'text-gray-500'}`}
                            >
                                Fresh
                            </button>
                            <button
                                onClick={() => setFilter('hot')}
                                className={`font-bold transition ${filter === 'hot' ? 'text-brand-glow' : 'text-gray-500'}`}
                            >
                                Burning 🔥
                            </button>
                        </div>
                    </div>
                </div>

                {/* Posts Stream */}
                <div className="flex flex-col gap-4 px-4 lg:px-6">
                    {sortedPosts.length > 0 ? (
                        sortedPosts.map(post => (
                            <ConfessionCard key={post.id} post={post} onVote={onVote} hideIdentity={hideIdentity} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-10 text-center glass-panel rounded-3xl border border-white/5">
                            <div className="text-4xl mb-4">🍵</div>
                            <h3 className="text-lg font-bold text-white mb-2">No tea here yet</h3>
                            <p className="text-sm text-gray-500">Be the first to drop some spice in this college!</p>
                        </div>
                    )}
                </div>

                <div className="h-20 lg:h-10" />
            </div>
        </main>
    );
}
