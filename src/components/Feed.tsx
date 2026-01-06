'use client';
import { useState, useEffect } from 'react';
import ConfessionCard, { Post } from './ConfessionCard';
import { Timer } from 'lucide-react';
import { cn, calculateNextDrop, formatCountdown } from '@/lib/utils';
import Leaderboard from './Leaderboard';
import TrendingTopics from './TrendingTopics';
import QuickGuide from './QuickGuide';
import { HelpCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Feed({
    posts,
    onVote,
    colleges = [],
    selectedCollegeId,
    onCollegeChange,
    userCollegeId,
    hideIdentity = true,
    globalMegaDrop,
    collegeName
}: {
    posts: Post[],
    onVote: (id: string, val: number) => void,
    colleges?: any[],
    selectedCollegeId?: string | null,
    onCollegeChange?: (id: string) => void,
    userCollegeId?: string | null,
    hideIdentity?: boolean,
    globalMegaDrop?: Post | null,
    collegeName?: string | null
}) {
    const [filter, setFilter] = useState<'new' | 'hot' | 'trending'>('new');
    const [showGuide, setShowGuide] = useState(false);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);

    useEffect(() => {
        const checkActivity = () => {
            const did = localStorage.getItem('device_id');
            if (did) {
                fetch(`/api/activity?device_id=${did}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.notifications?.length > 0) setHasNewNotifications(true);
                    });
            }
        };
        checkActivity();
        const interval = setInterval(checkActivity, 15000);
        return () => clearInterval(interval);
    }, []);
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
            <header className="lg:hidden glass-panel sticky top-0 z-30 px-6 py-3 flex flex-col gap-3 border-b border-white/5 bg-dark-950/80 backdrop-blur-3xl">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-glow rounded-full shadow-[0_0_15px_rgba(139,92,246,0.8)] animate-pulse" />
                        <h1 className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                            {collegeName || "The Drop"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/notifications"
                            className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition relative"
                        >
                            <Bell className="w-4 h-4" />
                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-dark-950" />
                        </Link>
                        <button
                            onClick={() => setShowGuide(true)}
                            className="p-2 rounded-full bg-white/5 border border-white/10 text-brand-glow hover:bg-white/10 transition"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
                            <span className="text-[9px] font-bold text-brand-glow tracking-widest">{nextDropCountdown}</span>
                        </div>
                    </div>
                </div>

                {/* Integrated Filter Tabs - More Compact */}
                <div className="flex p-0.5 bg-white/5 rounded-lg border border-white/5">
                    <button
                        onClick={() => setFilter('new')}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-md transition-all duration-300",
                            filter === 'new' ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Fresh
                    </button>
                    <button
                        onClick={() => setFilter('hot')}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-md transition-all duration-300",
                            filter === 'hot' ? "bg-brand-glow/10 text-brand-glow shadow-lg border border-brand-glow/20" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Burning 🔥
                    </button>
                    <button
                        onClick={() => setFilter('trending')}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-md transition-all duration-300",
                            filter === 'trending' ? "bg-purple-500/10 text-purple-400 shadow-lg border border-purple-500/20" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Trending 📈
                    </button>
                </div>
            </header>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto lg:overflow-visible pb-24 pt-2 lg:pt-8" id="scroller">

                {/* Worldwide Mega Drop Premiere */}
                {globalMegaDrop && (
                    <div className="px-4 lg:px-6 mb-8 mt-2">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-glow via-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 animate-pulse" />
                            <div className="relative bg-dark-900/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden">
                                <div className="bg-gradient-to-r from-brand-glow to-indigo-600 px-6 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Worldwide Premiere</span>
                                    </div>
                                    <span className="text-[9px] font-black text-white/80 uppercase">{globalMegaDrop.college_name}</span>
                                </div>
                                <div className="p-1">
                                    <ConfessionCard
                                        post={globalMegaDrop}
                                        onVote={onVote}
                                        hideIdentity={hideIdentity}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3 px-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">College Feed</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                    </div>
                )}

                {/* Desktop Header */}
                <div className="hidden lg:flex flex-col gap-4 px-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold uppercase tracking-widest">{collegeName || "CONFESSION"}</h2>
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

                {/* Posts Stream / Trending View */}
                <div className="flex flex-col gap-4 px-4 lg:px-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={filter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            {filter === 'trending' ? (
                                <div className="space-y-8 py-4">
                                    <TrendingTopics compact />
                                    <Leaderboard compact />
                                </div>
                            ) : sortedPosts.length > 0 ? (
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
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="h-20 lg:h-10" />
            </div>

            <QuickGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </main>
    );
}
