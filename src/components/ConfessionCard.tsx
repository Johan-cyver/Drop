import { ArrowBigUp, ArrowBigDown, Send, Clock, Bookmark, Share2, Sparkles } from 'lucide-react';
import { cn, formatNumber, formatTime, formatCountdown, getTimeRemaining } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import ShareModal from './ShareModal';

export interface Post {
    id: string;
    content: string;
    upvotes: number;
    downvotes: number;
    created_at: string;
    myVote?: number;
    tag?: string;
    handle?: string;
    avatar?: string;
    velocity?: string;
    hotScore?: number;
    public_id?: string;
    expires_at?: string;
    drop_active_at?: string;
    isDropActive?: boolean;
}

interface ConfessionCardProps {
    post: Post;
    onVote: (id: string, value: number) => void;
}

export default function ConfessionCard({ post, onVote }: ConfessionCardProps) {
    const voteStatus = post.myVote || 0;
    const isTrending = (post.hotScore && post.hotScore > 10) || post.upvotes >= 10;
    const isDropActive = post.isDropActive || false;
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Real-time timestamp updates
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000); // 1s for accurate timer

        return () => clearInterval(interval);
    }, []);

    const timeAgo = useMemo(() => {
        const date = new Date(post.created_at);
        const now = new Date(currentTime);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }, [post.created_at, currentTime]);

    const expiryCountdown = useMemo(() => {
        if (!post.expires_at || !isDropActive) return null;
        const remaining = getTimeRemaining(post.expires_at);
        return remaining > 0 ? formatCountdown(remaining) : null;
    }, [post.expires_at, isDropActive, currentTime]);

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-500"
            >
                {/* Dynamic Background Effect */}
                <div className={cn(
                    "absolute -top-20 -right-20 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 opacity-20",
                    isDropActive
                        ? "bg-gradient-to-br from-orange-500 to-yellow-500 animate-pulse"
                        : "bg-gradient-to-br from-brand-glow to-indigo-600 group-hover:opacity-30"
                )} />

                {/* Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-xl overflow-hidden backdrop-blur-md">
                            👻
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tight text-white/90">
                                {post.public_id || 'Anonymous'}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    {timeAgo}
                                </span>
                                {post.velocity && (
                                    <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                        {post.velocity}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isTrending && (
                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/50 scale-90 md:scale-100">
                            <Sparkles className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Hot Drop</span>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <Link href={`/confession/${post.id}`} className="relative z-10 block mb-8">
                    <p className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
                        {post.content}
                    </p>
                    {post.tag && (
                        <span className="text-brand-glow text-sm font-black uppercase tracking-widest opacity-80 hover:opacity-100 transition">
                            #{post.tag.replace('#', '')}
                        </span>
                    )}
                </Link>

                {/* Premium Timer / Status Bar */}
                {isDropActive && expiryCountdown && (
                    <div className="relative z-10 mb-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-between group/timer overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover/timer:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-orange-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-400/80">Evaporating</span>
                        </div>
                        <div className="text-xl font-black font-mono text-orange-400 relative z-10 tracking-tighter">
                            {expiryCountdown}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between relative z-10 pt-2">
                    <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 border border-white/5 backdrop-blur-xl">
                        <button
                            onClick={(e) => { e.preventDefault(); onVote(post.id, 1); }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-95",
                                voteStatus === 1 ? 'bg-brand-glow text-white shadow-lg' : 'text-gray-500 hover:text-white'
                            )}
                        >
                            <ArrowBigUp className={cn("w-6 h-6", voteStatus === 1 && "fill-current")} />
                            <span className="font-mono font-black text-sm">{formatNumber(post.upvotes - post.downvotes)}</span>
                        </button>

                        <button
                            onClick={(e) => { e.preventDefault(); onVote(post.id, -1); }}
                            className={cn(
                                "p-2 rounded-xl transition-all active:scale-95",
                                voteStatus === -1 ? 'text-red-400 bg-red-500/10' : 'text-gray-700 hover:text-red-400'
                            )}
                        >
                            <ArrowBigDown className={cn("w-6 h-6", voteStatus === -1 && "fill-current")} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const saved = JSON.parse(localStorage.getItem('my_echoes') || '[]');
                                const exists = saved.find((p: Post) => p.id === post.id);

                                if (exists) {
                                    const newSaved = saved.filter((p: Post) => p.id !== post.id);
                                    localStorage.setItem('my_echoes', JSON.stringify(newSaved));
                                } else {
                                    localStorage.setItem('my_echoes', JSON.stringify([post, ...saved]));
                                }
                                window.dispatchEvent(new Event('storage'));
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-brand-glow/10 text-gray-500 hover:text-brand-glow border border-white/5 transition-all group/save"
                        >
                            <Bookmark className="w-5 h-5 group-hover/save:fill-current" />
                        </button>

                        <button
                            onClick={(e) => { e.preventDefault(); setIsShareOpen(true); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-brand-glow/10 hover:bg-brand-glow text-gray-400 hover:text-white border border-brand-glow/20 transition-all shadow-[0_4px_15px_rgba(139,92,246,0.1)]"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.article>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                post={post}
            />
        </>
    );
}

