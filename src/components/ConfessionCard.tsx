import { ArrowBigUp, ArrowBigDown, Send, Clock, Bookmark, Share2 } from 'lucide-react';
import { cn, formatNumber, formatTime, formatCountdown, getTimeRemaining } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

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

    // Real-time timestamp updates
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        // Update every minute
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, []);

    // Recalculate time display whenever currentTime changes
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

    // DROP_ACTIVE countdown
    const expiryCountdown = useMemo(() => {
        if (!post.expires_at || !isDropActive) return null;
        const remaining = getTimeRemaining(post.expires_at);
        return remaining > 0 ? formatCountdown(remaining) : null;
    }, [post.expires_at, isDropActive, currentTime]);

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group"
        >
            {/* Gradient Overlay */}
            <div className={cn(
                "absolute -top-10 -right-10 w-40 h-40 blur-[60px] rounded-full pointer-events-none transition duration-700 ease-in-out",
                isDropActive
                    ? "bg-orange-500/20 border-orange-500/10 animate-pulse"
                    : "bg-brand-glow/10 border-brand-glow/5 group-hover:bg-brand-glow/15"
            )} />

            {/* Header / Badges */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl shadow-inner border border-white/5 overflow-hidden">
                        👻
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight">
                            {post.public_id || 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-mono">
                                {timeAgo}
                            </span>
                            {post.velocity && (
                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 rounded animate-pulse">
                                    {post.velocity}
                                </span>
                            )}
                        </div>
                    </div>
                    {isDropActive && expiryCountdown && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-orange-400" />
                            <span className="text-[10px] font-bold text-orange-400 animate-pulse">
                                Fading in {expiryCountdown}
                            </span>
                        </div>
                    )}
                </div>

                {isTrending && (
                    <div className="bg-orange-500/10 border border-orange-500/20 px-2 pl-1.5 py-1 rounded-full flex items-center gap-1 animate-pulse-slow shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                        <span className="text-xs">🔥</span>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Burning</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <Link href={`/confession/${post.id}`} className="relative z-10 block group-hover:scale-[1.01] transition-transform duration-300">
                <p className="text-xl md:text-2xl font-bold text-gray-100 leading-relaxed mb-6 cursor-pointer hover:text-white transition-colors">
                    {post.content}
                </p>
                {post.tag && <span className="text-brand-glow text-sm font-bold mb-4 block">#{post.tag.replace('#', '')}</span>}
            </Link>

            {/* Actions */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 pl-1 pr-3 border border-white/5 backdrop-blur-md">
                    <button
                        onClick={(e) => { e.preventDefault(); onVote(post.id, 1); }}
                        className={`p-2 rounded-full transition-all active:scale-90 ${voteStatus === 1 ? 'bg-brand-glow text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <ArrowBigUp className={`w-6 h-6 ${voteStatus === 1 ? 'fill-current' : ''}`} />
                    </button>

                    <span className={`font-mono font-bold text-lg min-w-[20px] text-center transition-all ${voteStatus !== 0 ? 'text-white' : 'text-gray-500'}`}>
                        {formatNumber(post.upvotes - post.downvotes)}
                    </span>

                    <button
                        onClick={(e) => { e.preventDefault(); onVote(post.id, -1); }}
                        className={`p-2 rounded-full transition-all active:scale-90 ${voteStatus === -1 ? 'text-red-400 bg-red-500/10' : 'text-gray-600 hover:text-red-400 opacity-50 hover:opacity-100'}`}
                    >
                        <ArrowBigDown className={`w-6 h-6 ${voteStatus === -1 ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* SAVE BUTTON (Echoes Library) */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            const saved = JSON.parse(localStorage.getItem('my_echoes') || '[]');
                            const exists = saved.find((p: Post) => p.id === post.id);

                            if (exists) {
                                const newSaved = saved.filter((p: Post) => p.id !== post.id);
                                localStorage.setItem('my_echoes', JSON.stringify(newSaved));
                                alert('Removed from Echoes library');
                            } else {
                                localStorage.setItem('my_echoes', JSON.stringify([post, ...saved]));
                                alert('Saved to Echoes library');
                            }
                            // Trigger storage event for live update
                            window.dispatchEvent(new Event('storage'));
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-purple-400 border border-white/5 transition active:scale-95 group/save"
                        title="Save to Echoes"
                    >
                        <Bookmark className="w-4 h-4 group-hover/save:fill-current" />
                    </button>

                    {/* Share Button */}
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            const url = `${window.location.origin}/confession/${post.id}`;
                            const shareData = {
                                title: 'The Drop - Anonymous Confession',
                                text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
                                url: url
                            };

                            try {
                                if (navigator.share) {
                                    await navigator.share(shareData);
                                } else {
                                    await navigator.clipboard.writeText(url);
                                    alert('Link copied!');
                                }
                            } catch (err) { }
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition active:scale-95"
                        title="Share confession"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        </motion.article>
    );
}

function VoteBtn({ icon: Icon, active, onClick, colorClass }: { icon: any, active: boolean, onClick: () => void, colorClass: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition active:scale-95",
                active ? colorClass : "text-gray-400"
            )}
        >
            <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
        </button>
    )
}

