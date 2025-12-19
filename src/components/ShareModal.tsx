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
    { name: 'Cosmic', class: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black', text: 'text-purple-200' },
    { name: 'Sunset', class: 'bg-gradient-to-br from-orange-600 via-pink-600 to-indigo-900', text: 'text-orange-50' },
    { name: 'Emerald', class: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-black', text: 'text-teal-200' },
    { name: 'Midnight', class: 'bg-gradient-to-br from-gray-900 via-blue-900 to-black', text: 'text-blue-200' },
    { name: 'Lava', class: 'bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500', text: 'text-red-50' },
];

import { QRCodeSVG } from 'qrcode.react';

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
    const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
    const [capturing, setCapturing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    if (!post) return null;

    const shareUrl = `${window.location.host === 'localhost:3000' ? 'http' : 'https'}://${window.location.host}/confession/${post.id}`;

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
                scale: 4,
                backgroundColor: 'rgba(0,0,0,0)', // Explicit transparency
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('[data-share-card]');
                    if (el) {
                        const style = (el as HTMLElement).style;
                        style.borderRadius = '2.5rem';
                        style.overflow = 'hidden';
                        style.background = 'transparent'; // Ensure the container itself doesn't have a default white bg
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
                a.download = `the-drop-${post.public_id}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert('Card saved to your device! 📸 Upload it to your story to share the vibe.');
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto"
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
                                "w-full aspect-[4/5] rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10",
                                selectedVibe.class
                            )}
                        >
                            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/20 blur-[100px] rounded-full" />
                                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-black/40 blur-[80px] rounded-full" />
                            </div>

                            <div className="flex items-center gap-3 mb-10 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold tracking-tighter text-white text-xl uppercase italic">THE DROP</span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center relative z-10 px-2">
                                <p className={cn(
                                    "text-3xl md:text-3xl font-black leading-[1.15] tracking-tight text-white"
                                )}>
                                    "{post.content}"
                                </p>
                                {post.tag && (
                                    <span className="mt-6 inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest text-white/80 self-start">
                                        #{post.tag.replace('#', '')}
                                    </span>
                                )}
                            </div>

                            <div className="mt-8 flex items-end justify-between relative z-10 border-t border-white/10 pt-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Dropped via</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs">👻</div>
                                        <span className="text-sm font-mono font-black text-white">{post.public_id}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="p-1.5 bg-white rounded-lg shadow-xl">
                                        <QRCodeSVG
                                            value={shareUrl}
                                            size={120}
                                            level="L"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Scan to Reveal</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="w-full flex flex-col gap-8 bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                            {/* Vibe Selector */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 text-center">Choose Vibe</span>
                                <div className="flex justify-center gap-3">
                                    {VIBES.map((vibe) => (
                                        <button
                                            key={vibe.name}
                                            onClick={() => setSelectedVibe(vibe)}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 transition-all p-0.5",
                                                selectedVibe.name === vibe.name ? "border-white scale-125 shadow-lg shadow-white/20" : "border-transparent opacity-40 hover:opacity-100"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-full", vibe.class)} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleShareAsImage}
                                    disabled={capturing}
                                    className="w-full bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-100 transition active:scale-95 shadow-xl disabled:opacity-50"
                                >
                                    {capturing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5" />
                                    )}
                                    {capturing ? 'Preparing Card...' : 'Share to Story'}
                                </button>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold border border-white/5 hover:bg-white/15 transition active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">Link</span>
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-6 bg-white/5 text-gray-400 py-4 rounded-2xl font-bold border border-white/5 hover:text-white transition active:scale-95"
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
