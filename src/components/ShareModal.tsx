'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Post } from './ConfessionCard';
import { cn } from '@/lib/utils';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post | null;
}

const VIBES = [
    { name: 'Cosmic', class: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black', icon: '🌌' },
    { name: 'Sunset', class: 'bg-gradient-to-br from-orange-600 via-pink-600 to-indigo-900', icon: '🌅' },
    { name: 'Emerald', class: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-black', icon: '🎋' },
    { name: 'Midnight', class: 'bg-gradient-to-br from-gray-900 via-blue-900 to-black', icon: '🌑' },
    { name: 'Lava', class: 'bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500', icon: '🔥' },
    { name: 'Ocean', class: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-900', icon: '🌊' },
];

import { QRCodeSVG } from 'qrcode.react';

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
    const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
    const [capturing, setCapturing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    if (!post) return null;

    const shareUrl = `${typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http' : 'https'}://${typeof window !== 'undefined' ? window.location.host : ''}/confession/${post.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    const handleShareAsImage = async () => {
        if (!cardRef.current) return;
        setCapturing(true);
        try {
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 3,
                backgroundColor: null,
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('[data-share-card]');
                    if (el) {
                        const style = (el as HTMLElement).style;
                        style.borderRadius = '3rem';
                        style.overflow = 'hidden';
                    }
                }
            });

            const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png', 1.0));
            const file = new File([blob], `drop-${post.public_id}.png`, { type: 'image/png' });

            const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });

            if (canShareFiles) {
                await navigator.share({
                    files: [file]
                });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `drop-${post.public_id}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert('Card saved! 📸');
            }
        } catch (err) {
            console.error('Capture failed', err);
            handleCopyLink();
        } finally {
            setCapturing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg flex flex-col items-center gap-6 py-10"
                    >
                        {/* The Shareable Card */}
                        <div
                            ref={cardRef}
                            data-share-card
                            className={cn(
                                "w-full aspect-[4/5] rounded-[3rem] p-10 flex flex-col relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10",
                                selectedVibe.class
                            )}
                        >
                            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                                <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-white/20 blur-[120px] rounded-full" />
                                <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-black/50 blur-[100px] rounded-full" />
                            </div>

                            <div className="flex items-center gap-3 mb-12 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-black tracking-tighter text-white text-2xl uppercase italic">THE DROP</span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center relative z-10 px-2">
                                <p className={cn(
                                    "text-3xl md:text-3xl font-black leading-[1.2] tracking-tight text-white drop-shadow-2xl"
                                )}>
                                    "{post.content}"
                                </p>
                                {post.tag && (
                                    <span className="mt-8 inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/90 self-start shadow-xl">
                                        #{post.tag.replace('#', '')}
                                    </span>
                                )}
                            </div>

                            <div className="mt-10 flex items-end justify-between relative z-10 border-t border-white/20 pt-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Identity verified</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner">👻</div>
                                        <span className="text-lg font-mono font-black text-white/90 tracking-tighter">{post.public_id}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3 translate-y-2">
                                    <div className="p-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/10">
                                        <QRCodeSVG
                                            value={shareUrl}
                                            size={140}
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Scan to Reveal</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="w-full flex flex-col gap-8 bg-white/5 p-8 rounded-[3rem] border border-white/5 backdrop-blur-2xl">
                            {/* Vibe Selector */}
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-gray-500 text-center">Customize Aesthetic</span>
                                <div className="flex justify-center gap-4 flex-wrap">
                                    {VIBES.map((vibe) => (
                                        <button
                                            key={vibe.name}
                                            onClick={() => setSelectedVibe(vibe)}
                                            className={cn(
                                                "w-12 h-12 rounded-2xl border-2 transition-all p-1 group relative",
                                                selectedVibe.name === vibe.name ? "border-brand-glow scale-110 shadow-2xl shadow-brand-glow/20" : "border-transparent opacity-40 hover:opacity-100"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-xl flex items-center justify-center text-xl", vibe.class)}>
                                                {vibe.icon}
                                            </div>
                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                {vibe.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4 pt-4">
                                <button
                                    onClick={handleShareAsImage}
                                    disabled={capturing}
                                    className="w-full bg-white text-black py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-glow hover:text-white transition-all active:scale-95 shadow-2xl disabled:opacity-50 group"
                                >
                                    {capturing ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    )}
                                    <span className="text-lg uppercase tracking-tight">{capturing ? 'Developing Card...' : 'Share to Story'}</span>
                                </button>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex-1 bg-white/10 text-white py-5 rounded-2xl font-black border border-white/10 hover:bg-white/20 transition active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Copy className="w-5 h-5 text-gray-400" />
                                        <span className="uppercase tracking-widest text-xs">Copy Link</span>
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-8 bg-white/5 text-gray-500 py-5 rounded-2xl font-black border border-white/5 hover:text-white transition active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[11px] text-gray-600 uppercase tracking-widest font-black opacity-50 pb-4">
                            Confession Card
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
