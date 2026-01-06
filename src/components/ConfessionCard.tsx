import { ArrowBigUp, ArrowBigDown, Send, Clock, Bookmark, Share2, Sparkles, MessageCircle, Zap, Lock } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';
import { cn, formatNumber, formatTime, formatCountdown, getTimeRemaining } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import ShareModal from './ShareModal';
import DropChat from './DropChat';
import { Haptics } from '@/lib/haptics';

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
    revealed_words?: number[];
    comment_count?: number;
    image?: string | null; // Data URI for camera photo
    color?: string; // Custom card color for sharing
    isDropActive?: boolean;
    has_peeked?: boolean;
    reactions?: { emoji: string; count: number; active?: boolean }[];
    has_poll?: boolean;
    poll_options?: string[];
    poll_votes?: Record<number, number>;
    college_name?: string;
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
    const [viewerCount, setViewerCount] = useState(0);
    const emojis = ['🔥', '😂', '😮', '🧊', '🚩'];

    // Poll State
    const [pollVotes, setPollVotes] = useState<Record<number, number>>(post.poll_votes || {});
    const [hasVotedPoll, setHasVotedPoll] = useState(false);

    // Surgical Peek State
    const [revealedMap, setRevealedMap] = useState<Record<number, string>>({});
    const [confirmPeekIndex, setConfirmPeekIndex] = useState<number | null>(null);

    const pollTotal = useMemo(() =>
        Object.values(pollVotes).reduce((a, b) => a + b, 0)
        , [pollVotes]);

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        const vKey = `voted_poll_${post.id}`;
        if (localStorage.getItem(vKey)) setHasVotedPoll(true);
    }, [post.id]);

    useEffect(() => {
        if (post.reactions) setReactions(post.reactions);

        // Pulse Heartbeat (Tell system we are viewing this card)
        const sendPulse = async () => {
            try {
                const did = localStorage.getItem('device_id');
                const res = await fetch('/api/pulse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        device_id: did,
                        viewing_confession_id: post.id
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    setViewerCount(data.post_viewers || 0);
                }
            } catch (e) { }
        };

        sendPulse();
        const pulseInterval = setInterval(sendPulse, 10000); // 10s heartbeat
        return () => clearInterval(pulseInterval);
    }, [post.reactions, post.id]);

    const handleReaction = async (emoji: string) => {
        Haptics.light();
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

    const handlePollVote = async (index: number) => {
        if (hasVotedPoll) return;

        // Optimistic
        const newVotes = { ...pollVotes, [index]: (pollVotes[index] || 0) + 1 };
        setPollVotes(newVotes);
        setHasVotedPoll(true);
        localStorage.setItem(`voted_poll_${post.id}`, 'true');

        try {
            const did = localStorage.getItem('device_id');
            const res = await fetch('/api/confess/poll/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confession_id: post.id, option_index: index, device_id: did })
            });
            if (res.ok) {
                showToast('+20 Drop Coins! Vote recorded.', 'success');
                window.dispatchEvent(new Event('balance_update'));
            }
        } catch (e) {
            console.error('Poll vote failed', e);
        }
    };

    const handleSurgicalPeek = async (index: number) => {
        try {
            const did = localStorage.getItem('device_id');
            const res = await fetch('/api/user/peek', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confession_id: post.id,
                    device_id: did,
                    word_index: index
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.word) {
                    setRevealedMap(prev => ({ ...prev, [index]: data.word }));
                }
                window.dispatchEvent(new Event('balance_update'));
                showToast('Word revealed!', 'success');
            } else {
                const err = await res.json();
                showToast(err.error || 'Peek failed', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
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
                    "relative group rounded-3xl p-1 transition-all duration-300 md:p-1",
                    "md:p-1 p-0.5", // Even tighter on mobile
                    isDropActive ? "bg-gradient-to-br from-white/5 to-white/0 hover:bg-white/10" : "bg-gray-900/50 border border-red-900/20"
                )}
            >
                <div className="bg-dark-950/40 backdrop-blur-sm rounded-[2.5rem] p-5 md:p-8 border border-white/5 shadow-2xl overflow-hidden relative">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 md:mb-6 relative z-10">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl overflow-hidden backdrop-blur-md relative">
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                {canShowIdentity && post.handle ? (
                                    <Link
                                        href={`/profile/${post.handle}`}
                                        className="text-xs md:text-sm font-black tracking-tight text-brand-glow hover:underline hover:text-white transition-all"
                                    >
                                        @{post.handle}
                                    </Link>
                                ) : (
                                    <span className="text-xs md:text-sm font-black tracking-tight text-white/90">
                                        {post.public_id || 'Anonymous'}
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {timeAgo}
                                    </span>
                                    {post.is_shadow && (
                                        <span className="text-[8px] md:text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                                            <Sparkles className="w-2 h-2" /> SHADOW
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isTrending && (
                            <div className="flex items-center gap-2 md:gap-3">
                                {viewerCount > 1 && (
                                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                                        {viewerCount} Watching
                                    </div>
                                )}
                                <div className="bg-orange-500 text-white px-2 py-1 md:px-3 rounded-full flex items-center gap-1 shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/50 scale-75 md:scale-100 origin-right">
                                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider">Hot</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 mb-4 md:mb-6">
                        <div className="block">
                            <div className={cn(
                                "text-lg md:text-2xl font-bold text-white leading-tight mb-3 tracking-tight transition-all duration-700 flex flex-wrap gap-x-1.5 md:gap-x-2",
                                (isShadowLocked && !post.tease_content) ? "blur-xl select-none opacity-50" : "blur-0"
                            )}>
                                {(() => {
                                    if (isShadowLocked && post.tease_content) {
                                        return post.tease_content.split(/\s+/).map((word, idx) => {
                                            const isPlaceholder = word === '_____';
                                            const isLocalRevealed = revealedMap[idx];
                                            const isServerRevealed = post.revealed_words?.includes(idx);

                                            if (isPlaceholder && !isLocalRevealed && !isServerRevealed) {
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setConfirmPeekIndex(idx);
                                                        }}
                                                        className="inline-block px-2 bg-brand-glow/20 rounded-md blur-[3px] hover:blur-0 transition-all cursor-pointer select-none border border-brand-glow/30"
                                                    >
                                                        {word}
                                                    </button>
                                                );
                                            }
                                            return (
                                                <span key={idx} className={cn(isLocalRevealed || isServerRevealed ? "text-brand-glow animate-in fade-in zoom-in-95 duration-500" : "")}>
                                                    {isLocalRevealed || (isServerRevealed ? "..." : word)}
                                                </span>
                                            );
                                        });
                                    }
                                    return post.content;
                                })()}
                            </div>
                        </div>

                        {/* Confirmation Modal for Word Peek */}
                        <AnimatePresence>
                            {confirmPeekIndex !== null && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setConfirmPeekIndex(null)}
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        className="relative bg-dark-900 border border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-[320px] text-center space-y-4"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-brand-glow/10 flex items-center justify-center mx-auto">
                                            <Zap className="w-8 h-8 text-brand-glow" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Reveal this word?</h3>
                                            <p className="text-xs text-gray-500 font-bold mt-1">This will cost you 100 Drop Coins. 67 DC goes to the author.</p>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => setConfirmPeekIndex(null)}
                                                className="flex-1 py-3.5 rounded-2xl bg-white/5 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition"
                                            >
                                                Nah
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleSurgicalPeek(confirmPeekIndex);
                                                    setConfirmPeekIndex(null);
                                                }}
                                                className="flex-1 py-3.5 rounded-2xl bg-brand-glow text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-glow/20 hover:scale-[1.02] transition active:scale-95"
                                            >
                                                Peek it
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {isShadowLocked && !post.tease_content && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                                <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl space-y-2 md:space-y-3 w-full max-w-[280px]">
                                    <p className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] text-white/50">Curiosity Unlock</p>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-glow shadow-[0_0_15px_rgba(139,92,246,0.6)] transition-all duration-1000"
                                            style={{ width: `${unlockProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] md:text-[10px] font-black text-brand-glow uppercase tracking-wider">{post.upvotes} / {post.unlock_votes || 5}</p>

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
                                        className="w-full py-2.5 md:py-4 mt-1 bg-brand-glow text-white rounded-xl md:rounded-2xl shadow-lg shadow-brand-glow/20 flex items-center justify-center gap-2 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-white/10 active:scale-95"
                                    >
                                        <Zap className="w-3 h-3 fill-current" /> Peek All (Soon)
                                    </button>
                                </div>
                            </div>
                        )}

                        {post.has_poll && Array.isArray(post.poll_options) && !isShadowLocked && (
                            <div className="mt-4 space-y-2">
                                {post.poll_options.map((option, idx) => {
                                    const votes = pollVotes[idx] || 0;
                                    const percent = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.preventDefault(); handlePollVote(idx); }}
                                            disabled={hasVotedPoll}
                                            className={cn(
                                                "w-full relative h-10 md:h-12 rounded-xl md:rounded-2xl border transition-all overflow-hidden text-left px-4 group/poll",
                                                hasVotedPoll
                                                    ? "bg-white/5 border-white/5 pointer-events-none"
                                                    : "bg-white/5 border-white/5 hover:border-brand-glow/30 hover:bg-white/10"
                                            )}
                                        >
                                            {/* Progress Bar */}
                                            {hasVotedPoll && (
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    className="absolute inset-0 bg-brand-glow/20"
                                                />
                                            )}
                                            <div className="relative z-10 flex justify-between items-center w-full h-full">
                                                <span className={cn(
                                                    "text-xs font-bold transition-all",
                                                    hasVotedPoll ? "text-white" : "text-gray-400 group-hover/poll:text-white"
                                                )}>
                                                    {option}
                                                </span>
                                                {hasVotedPoll && (
                                                    <span className="text-[10px] font-black text-brand-glow font-mono">{percent}%</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {post.tag && (
                            <span className="text-brand-glow text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-3 inline-block">
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
                    <div className="flex items-center justify-between relative z-10 md:pt-2">
                        <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 md:p-1.5 border border-white/5 backdrop-blur-xl scale-90 md:scale-100 origin-left">
                            <button
                                onClick={(e) => { e.preventDefault(); Haptics.light(); onVote(post.id, 1); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition-all active:scale-95",
                                    voteStatus === 1 ? 'bg-brand-glow text-white shadow-lg shadow-brand-glow/20' : 'text-gray-500 hover:text-white'
                                )}
                            >
                                <ArrowBigUp className={cn("w-5 h-5 md:w-6 md:h-6", voteStatus === 1 && "fill-current")} />
                                <span className="font-mono font-black text-xs md:text-sm">{formatNumber(post.upvotes - post.downvotes)}</span>
                            </button>

                            <button
                                onClick={(e) => { e.preventDefault(); Haptics.light(); onVote(post.id, -1); }}
                                className={cn(
                                    "p-1.5 md:p-2 rounded-xl transition-all active:scale-95",
                                    voteStatus === -1 ? 'text-red-400 bg-red-500/10' : 'text-gray-700 hover:text-red-400'
                                )}
                            >
                                <ArrowBigDown className={cn("w-5 h-5 md:w-6 md:h-6", voteStatus === -1 && "fill-current")} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 scale-90 md:scale-100 origin-right">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsChatOpen(true);
                                }}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-brand-glow border border-white/5 transition-all flex flex-col items-center justify-center gap-0.5 relative"
                                title={!isDropActive ? "View Echoes" : "Open Tea Lounge"}
                            >
                                <Zap className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isDropActive ? "fill-current" : "")} />
                                <span className="text-[8px] md:text-[10px] font-black">{(post as any).message_count || 0}</span>
                                {!isDropActive && (
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black" />
                                )}
                            </button>

                            <button
                                onClick={toggleSave}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white/5 hover:bg-brand-glow/10 text-gray-500 hover:text-brand-glow border border-white/5 transition-all group/save active:scale-95 shadow-lg shadow-black/20"
                            >
                                <Bookmark
                                    className={cn(
                                        "w-4 h-4 md:w-5 md:h-5 group-hover/save:fill-current",
                                        isSaved ? "text-brand-glow fill-current" : ""
                                    )}
                                />
                            </button>

                            <button
                                onClick={(e) => { e.preventDefault(); setIsShareOpen(true); }}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white/5 hover:bg-brand-glow text-gray-400 hover:text-white border border-white/5 transition-all active:scale-95 shadow-lg shadow-black/20"
                            >
                                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
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

