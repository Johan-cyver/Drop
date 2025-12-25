'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    handle: string;
    avatar: string;
    content: string;
    created_at: string;
    device_id: string;
    reply_to_id?: string;
    reply_to_handle?: string;
    reply_to_content?: string;
}

interface DropChatProps {
    confessionId: string;
    deviceId: string;
    userHandle?: string;
    userAvatar?: string;
    isDropActive?: boolean;
    onClose: () => void;
}

export default function DropChat({ confessionId, deviceId, userHandle, userAvatar, isDropActive = true, onClose }: DropChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat/${confessionId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchOnlineCount = async () => {
        try {
            const res = await fetch(`/api/chat/${confessionId}/online?device_id=${deviceId}`);
            if (res.ok) {
                const data = await res.json();
                setOnlineCount(data.onlineCount || 0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchOnlineCount();
        const interval = setInterval(() => {
            fetchMessages();
            fetchOnlineCount();
        }, 1500); // Poll every 1.5 seconds for real-time feel
        return () => clearInterval(interval);
    }, [confessionId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const content = input.trim();
        setInput('');
        const replyToId = replyTo?.id;
        setReplyTo(null);

        try {
            await fetch(`/api/chat/${confessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: deviceId,
                    handle: userHandle,
                    avatar: userAvatar,
                    content,
                    reply_to_id: replyToId
                })
            });
            fetchMessages();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-dark-950/95 backdrop-blur-2xl border-l border-white/10 z-[60] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-widest text-white">Tea Lounge</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-brand-glow uppercase tracking-widest">Live Ephemeral Chat</p>
                        {onlineCount > 0 && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-green-400">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                {onlineCount} online
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-brand-glow/20 border-t-brand-glow rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                            <Send className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest">Empty silence... Start the tea.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.device_id === deviceId;
                        const avatarUrl = msg.avatar?.startsWith('data:')
                            ? msg.avatar
                            : `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.handle || msg.id}`;

                        return (
                            <div key={msg.id} className="space-y-1">
                                {/* Reply indicator */}
                                {msg.reply_to_id && msg.reply_to_handle && (
                                    <div className={cn("text-[9px] text-gray-600 italic px-2", isMe ? "text-right" : "text-left")}>
                                        Replying to {msg.reply_to_handle}: "{msg.reply_to_content?.substring(0, 30)}{(msg.reply_to_content?.length || 0) > 30 ? '...' : ''}"
                                    </div>
                                )}
                                <div className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                                    <div className="w-8 h-8 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10">
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[75%]">
                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm",
                                            isMe
                                                ? "bg-brand-glow text-white rounded-tr-none"
                                                : "bg-white/5 text-gray-200 border border-white/5 rounded-tl-none"
                                        )}>
                                            <p className={cn(
                                                "text-[9px] font-extrabold uppercase tracking-widest mb-1",
                                                isMe ? "text-white/60 text-right" : "text-brand-glow"
                                            )}>
                                                {msg.handle || 'Anonymous Member'}
                                            </p>
                                            <p className="leading-relaxed">{msg.content}</p>
                                        </div>
                                        {!isMe && (
                                            <button
                                                onClick={() => setReplyTo(msg)}
                                                className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-brand-glow transition px-2"
                                            >
                                                Reply
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            {isDropActive ? (
                <form onSubmit={handleSend} className="p-6 bg-black/40 border-t border-white/5">
                    {replyTo && (
                        <div className="mb-3 flex items-center justify-between px-4 py-2 bg-brand-glow/10 border border-brand-glow/20 rounded-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-glow">
                                Replying to {replyTo.handle || 'Anonymous'}
                            </span>
                            <button type="button" onClick={() => setReplyTo(null)} className="text-brand-glow hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-glow to-indigo-500 rounded-2xl blur opacity-20 group-focus-within:opacity-100 transition duration-500" />
                        <div className="relative bg-dark-900 rounded-2xl p-2 flex items-center gap-2 border border-white/10">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={replyTo ? `Replying to ${replyTo.handle}...` : "Roast the logic..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 text-sm px-4 py-3"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className={cn(
                                    "p-3 rounded-xl transition-all active:scale-95 shadow-xl",
                                    input.trim()
                                        ? "bg-brand-glow text-white"
                                        : "bg-white/5 text-gray-700"
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-10 bg-black/40 border-t border-white/5 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Lock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white mb-1">Tea Lounge Evaporated</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">This lounge is now read-only.</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
