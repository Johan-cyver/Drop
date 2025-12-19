'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Sparkles } from 'lucide-react';
import { Post } from './ConfessionCard';
import { cn } from '@/lib/utils';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post | null;
}

const VIBES = [
    { name: 'Cosmic', class: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black', text: 'text-purple-200' },
    { name: 'Sunset', class: 'bg-gradient-to-br from-orange-600 via-pink-600 to-indigo-900', text: 'text-orange-50' },
    { name: 'Emerald', class: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-black', text: 'text-teal-200' },
    { name: 'Midnight', class: 'bg-gradient-to-br from-gray-900 via-blue-900 to-black', text: 'text-blue-200' },
    { name: 'Lava', class: 'bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500', text: 'text-red-50' },
];

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
    const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
    const cardRef = useRef<HTMLDivElement>(null);

    if (!post) return null;

    const shareUrl = `${window.location.origin}/confession/${post.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: 'The Drop - Anonymous Confession',
                text: post.content,
                url: shareUrl
            });
        } catch (err) {
            handleCopyLink();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg flex flex-col items-center gap-8"
                    >
                        {/* The Shareable Card */}
                        <div
                            ref={cardRef}
                            className={cn(
                                "w-full aspect-[4/5] rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10",
                                selectedVibe.class
                            )}
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/20 blur-[100px] rounded-full" />
                                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-black/40 blur-[80px] rounded-full" />
                            </div>

                            {/* Logo */}
                            <div className="flex items-center gap-3 mb-12 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold tracking-tighter text-white text-xl">THE DROP</span>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col justify-center relative z-10">
                                <p className={cn(
                                    "text-3xl md:text-4xl font-black leading-[1.1] tracking-tight text-balance",
                                    selectedVibe.text
                                )}>
                                    "{post.content}"
                                </p>
                                {post.tag && (
                                    <span className="mt-6 inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest text-white/80 self-start">
                                        #{post.tag.replace('#', '')}
                                    </span>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="mt-8 flex items-baseline justify-between relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Dropped via</span>
                                    <span className="text-sm font-mono font-bold text-white/80">{post.public_id}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Scan to reveal</span>
                                    <div className="text-xs font-bold text-white tracking-tight">thedrop.app</div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="w-full flex flex-col gap-6">
                            {/* Vibe Selector */}
                            <div className="flex justify-center gap-3">
                                {VIBES.map((vibe) => (
                                    <button
                                        key={vibe.name}
                                        onClick={() => setSelectedVibe(vibe)}
                                        className={cn(
                                            "w-10 h-10 rounded-full border-2 transition-all p-0.5",
                                            selectedVibe.name === vibe.name ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn("w-full h-full rounded-full", vibe.class)} />
                                    </button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleNativeShare}
                                    className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition active:scale-95"
                                >
                                    <Share2 className="w-5 h-5" />
                                    Share
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="px-6 bg-white/10 text-white py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/20 transition active:scale-95"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-center text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                                Spotify-style confession card
                            </p>
                        </div>
                    </motion.div>

                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
