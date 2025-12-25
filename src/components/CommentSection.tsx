'use client';

import { useState } from 'react';
import { Post } from './ConfessionCard';
import { Send, User as UserIcon, MessageCircle, X } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
    id: string;
    content: string;
    handle: string;
    avatar: string;
    created_at: string;
    parent_id?: string;
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
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        let did = deviceId || localStorage.getItem('device_id');
        if (!did) {
            did = crypto.randomUUID();
            localStorage.setItem('device_id', did);
        }

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confession_id: confessionId,
                    content: newComment.trim(),
                    device_id: did,
                    parent_id: replyTo?.id
                })
            });

            if (res.ok) {
                setNewComment('');
                setReplyTo(null);
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

    // Threading Logic
    const parentComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
        const avatarUrl = comment.avatar?.startsWith('data:')
            ? comment.avatar
            : `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.handle || comment.id}`;

        return (
            <motion.div
                initial={{ opacity: 0, x: isReply ? 20 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                    "flex gap-4 p-4 rounded-3xl border transition-all",
                    isReply
                        ? "bg-white/[0.02] border-white/5 ml-8 mt-2"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
            >
                <div className={cn(
                    "w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-lg overflow-hidden shadow-lg",
                    isReply && "w-8 h-8 rounded-xl"
                )}>
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-black text-white/90 truncate">
                            {comment.handle || 'Guest'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter whitespace-nowrap">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed break-words">
                        {comment.content}
                    </p>
                    {!isReply && (
                        <button
                            onClick={() => {
                                setReplyTo(comment);
                                document.querySelector('input')?.focus();
                            }}
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-brand-glow hover:text-white transition"
                        >
                            Reply
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="mt-8 space-y-6 pb-20">
            <div className="flex items-center gap-2 px-2">
                <MessageCircle className="w-5 h-5 text-brand-glow" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white/70">
                    Conversations ({comments.length})
                </h3>
            </div>

            {/* Comment Input */}
            <div className="space-y-3">
                {replyTo && (
                    <div className="flex items-center justify-between px-4 py-2 bg-brand-glow/10 border border-brand-glow/20 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-glow">
                            Replying to {replyTo.handle || 'Guest'}
                        </span>
                        <button onClick={() => setReplyTo(null)} className="text-brand-glow hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-glow/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative glass-card rounded-2xl p-2 flex items-center gap-2 border border-white/5 bg-white/5 backdrop-blur-xl">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? "Write a reply..." : "Add to the logic..."}
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
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                <AnimatePresence initial={false}>
                    {parentComments.length > 0 ? (
                        parentComments.map((comment) => (
                            <div key={comment.id} className="space-y-2">
                                <CommentItem comment={comment} />
                                {getReplies(comment.id).map(reply => (
                                    <CommentItem key={reply.id} comment={reply} isReply />
                                ))}
                            </div>
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
