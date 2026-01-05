import { ArrowBigUp, ArrowBigDown, Send, Clock, Bookmark, Share2, Sparkles, MessageCircle, Zap, Lock } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';
import { cn, formatNumber, formatTime, formatCountdown, getTimeRemaining } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import ShareModal from './ShareModal';
import DropChat from './DropChat';

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
    is_shadow: boolean;
    is_open: boolean;
    unlock_threshold: number;
    unlock_votes: number;
    tease_content?: string | null;
    comment_count?: number;
    image?: string | null; // Data URI for camera photo
    color?: string; // Custom card color for sharing
    isDropActive?: boolean;
    has_peeked?: boolean;
    reactions?: { emoji: string; count: number; active?: boolean }[];
}

interface ConfessionCardProps {
    post: Post;
    onVote: (id: string, value: number) => Promise<void> | void;
    hideIdentity?: boolean;
}

export default function ConfessionCard({ post, onVote, hideIdentity = false }: ConfessionCardProps) {
    const voteStatus = post.myVote || 0;
    const isTrending = (post.hotScore && post.hotScore > 10) || post.upvotes >= 10;

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Shadow Drop Logic
    const [hasPeeked, setHasPeeked] = useState(post.has_peeked);
    const isShadowLocked = post.is_shadow && post.upvotes < (post.unlock_votes || 5) && !hasPeeked;
    const unlockProgress = Math.min(100, (post.upvotes / (post.unlock_votes || 5)) * 100);

    // Reactions
    const [reactions, setReactions] = useState(post.reactions || []);
    const emojis = ['🔥', '😂', '😮', '🧊', '🚩'];

    useEffect(() => {
        if (post.reactions) setReactions(post.reactions);
    }, [post.reactions]);

    const handleReaction = async (emoji: string) => {
        // Optimistic
        const existing = reactions.find(r => r.emoji === emoji);
        let newReactions;
        if (existing?.active) {
            newReactions = reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, active: false } : r);
        } else if (existing) {
            newReactions = reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, active: true } : r);
        } else {
            newReactions = [...reactions, { emoji, count: 1, active: true }];
        }
        setReactions(newReactions);

        try {
            const did = localStorage.getItem('device_id');
            await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confession_id: post.id, emoji, device_id: did })
            });
            window.dispatchEvent(new Event('balance_update'));
        } catch (e) {
            console.error('Reaction failed', e);
        }
    };

    // Real-time timestamp updates
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000); // 1s for accurate timer

        return () => clearInterval(interval);
    }, []);

    const isDropActiveClient = useMemo(() => {
        if (!post.drop_active_at || !post.expires_at) return post.isDropActive || false;
        const now = currentTime;
        const start = new Date(post.drop_active_at).getTime();
        const end = new Date(post.expires_at).getTime();
        return now >= start && now < end;
    }, [post.drop_active_at, post.expires_at, post.isDropActive, currentTime]);

    const isDropActive = isDropActiveClient;

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

    // Avatar Logic (DiceBear fallbacks)
    const canShowIdentity = post.is_open && !hideIdentity;
    const avatarUrl = canShowIdentity && post.avatar
        ? (post.avatar.startsWith('data:') ? post.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${post.avatar}`)
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${post.public_id || 'ghost'}`;

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('my_echoes') || '[]');
        setIsSaved(saved.some((p: any) => p.id === post.id));
    }, [post.id]);

    const toggleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        const saved = JSON.parse(localStorage.getItem('my_echoes') || '[]');
        const exists = saved.find((p: Post) => p.id === post.id);

        if (exists) {
            const newSaved = saved.filter((p: Post) => p.id !== post.id);
            localStorage.setItem('my_echoes', JSON.stringify(newSaved));
            setIsSaved(false);
            showToast('Removed from Echoes', 'info');
        } else {
            localStorage.setItem('my_echoes', JSON.stringify([post, ...saved]));
            setIsSaved(true);
            showToast('Saved to Echoes!', 'success');
        }
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                    "relative group rounded-3xl p-1 transition-all duration-300",
                    isDropActive ? "bg-gradient-to-br from-white/5 to-white/0 hover:bg-white/10" : "bg-gray-900/50 border border-red-900/20"
                )}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-xl overflow-hidden backdrop-blur-md relative">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            {canShowIdentity && post.handle ? (
                                <Link
                                    href={`/profile/${post.handle}`}
                                    className="text-sm font-black tracking-tight text-brand-glow hover:underline hover:text-white transition-all"
                                >
                                    {post.handle}
                                </Link>
                            ) : (
                                <span className="text-sm font-black tracking-tight text-white/90">
                                    {post.public_id || 'Anonymous'}
                                </span>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    {timeAgo}
                                </span>
                                {post.is_shadow && (
                                    <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                                        <Sparkles className="w-2 h-2" /> SHADOW
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

                {/* Content */}
                <div className="relative z-10 mb-6">
                    <Link href={`/confession/${post.id}`} className="block">
                        <p className={cn(
                            "text-xl md:text-2xl font-bold text-white leading-tight mb-4 tracking-tight transition-all duration-700",
                            isShadowLocked ? "blur-xl select-none opacity-50" : "blur-0"
                        )}>
                            {post.content}
                        </p>
                    </Link>

                    {isShadowLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-2xl space-y-3">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Curiosity Unlock</p>
                                <p className="text-sm font-bold text-white">Unlock this tea with {post.unlock_votes || 5} Upvotes</p>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-brand-glow shadow-[0_0_15px_rgba(139,92,246,0.6)] transition-all duration-1000"
                                        style={{ width: `${unlockProgress}%` }}
                                    />
                                </div>
                                <p className="text-[10px] font-black text-brand-glow">{post.upvotes} / {post.unlock_votes || 5}</p>

                                <button
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        try {
                                            const did = localStorage.getItem('device_id');
                                            const res = await fetch('/api/user/peek', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ confession_id: post.id, device_id: did })
                                            });
                                            if (res.ok) {
                                                setHasPeeked(true);
                                                window.dispatchEvent(new Event('balance_update'));
                                                showToast('Peek successful!', 'success');
                                            } else {
                                                const err = await res.json();
                                                showToast(err.error || 'Peek failed', 'error');
                                            }
                                        } catch (e) {
                                            showToast('Network error', 'error');
                                        }
                                    }}
                                    className="w-full py-4 mt-2 bg-white/10 hover:bg-brand-glow hover:text-white rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest text-white/70"
                                >
                                    <Zap className="w-3 h-3" /> Peek for 50 Coins
                                </button>
                            </div>
                        </div>
                    )}

                    {post.tag && (
                        <span className="text-brand-glow text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                            #{post.tag.replace('#', '')}
                        </span>
                    )}
                </div>

                {post.image && !isShadowLocked && (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-6 border border-white/5 shadow-2xl">
                        <img src={post.image} alt="Confession" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                )}

                {/* Reactions Bar */}
                <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                    {emojis.map(emoji => {
                        const countObj = reactions.find(r => r.emoji === emoji);
                        const count = countObj ? countObj.count : 0;
                        const active = countObj ? countObj.active : false;

                        return (
                            <button
                                key={emoji}
                                onClick={(e) => { e.preventDefault(); handleReaction(emoji); }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all active:scale-90",
                                    active
                                        ? "bg-brand-glow/10 border-brand-glow/30 text-white"
                                        : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <span className="text-lg">{emoji}</span>
                                {count > 0 && <span className="text-[10px] font-black font-mono">{count}</span>}
                            </button>
                        );
                    })}
                </div>

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
                                setIsChatOpen(true);
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-brand-glow border border-white/5 transition-all flex flex-col items-center justify-center gap-0.5 relative"
                            title={!isDropActive ? "View Echoes" : "Open Tea Lounge"}
                        >
                            <Zap className={cn("w-4 h-4", isDropActive ? "fill-current" : "")} />
                            <span className="text-[10px] font-black">{(post as any).message_count || 0}</span>
                            {!isDropActive && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black" />
                            )}
                        </button>

                        <button
                            onClick={toggleSave}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-brand-glow/10 text-gray-500 hover:text-brand-glow border border-white/5 transition-all group/save active:scale-95"
                        >
                            <Bookmark
                                className={cn(
                                    "w-5 h-5 group-hover/save:fill-current",
                                    isSaved ? "text-brand-glow fill-current" : ""
                                )}
                            />
                        </button>

                        <button
                            onClick={(e) => { e.preventDefault(); setIsShareOpen(true); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-brand-glow text-gray-400 hover:text-white border border-white/5 transition-all active:scale-95"
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

            <AnimatePresence>
                {isChatOpen && (
                    <DropChat
                        confessionId={post.id}
                        deviceId={localStorage.getItem('device_id') || ''}
                        userHandle={localStorage.getItem('user_handle') || undefined}
                        userAvatar={localStorage.getItem('user_avatar') || undefined}
                        isDropActive={isDropActive}
                        onClose={() => setIsChatOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

