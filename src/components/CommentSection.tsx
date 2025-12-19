'use client';

import { useState } from 'react';
import { Post } from './ConfessionCard';
import { Send, User as UserIcon, MessageCircle } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
    id: string;
    content: string;
    handle: string;
    avatar: string;
    created_at: string;
}

interface CommentSectionProps {
    confessionId: string;
    comments: Comment[];
    deviceId: string;
    onCommentAdded: () => void;
}

export default function CommentSection({ confessionId, comments, deviceId, onCommentAdded }: CommentSectionProps) {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confession_id: confessionId,
                    content: newComment.trim(),
                    device_id: deviceId
                })
            });

            if (res.ok) {
                setNewComment('');
                onCommentAdded();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Comment Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center gap-2 px-2">
                <MessageCircle className="w-5 h-5 text-brand-glow" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white/70">
                    Conversations ({comments.length})
                </h3>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-glow/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative glass-card rounded-2xl p-2 flex items-center gap-2 border border-white/5 bg-white/5 backdrop-blur-xl">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add to the logic..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 text-sm px-4 py-2"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className={cn(
                            "p-2 rounded-xl transition-all active:scale-95",
                            newComment.trim()
                                ? "bg-brand-glow text-white shadow-lg shadow-brand-glow/20"
                                : "bg-white/5 text-gray-700"
                        )}
                    >
                        <Send className={cn("w-4 h-4", isSubmitting && "animate-pulse")} />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {comments.length > 0 ? (
                        comments.map((comment, idx) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-glow/10 to-transparent border border-white/10 flex-shrink-0 flex items-center justify-center text-lg overflow-hidden shadow-lg">
                                    {comment.avatar?.startsWith('data:') ? (
                                        <img src={comment.avatar} alt={comment.handle} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-brand-glow">{comment.avatar || '👤'}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-black text-white/90 truncate">
                                            {comment.handle || 'Guest User'}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter whitespace-nowrap">
                                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed break-words">
                                        {comment.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <MessageCircle className="w-6 h-6 text-gray-700" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium tracking-tight">
                                No ripples yet. Be the first to react.
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
