'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Hash, Camera, ShieldCheck, AlertCircle, Zap, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CameraCapture from './CameraCapture';
import HelplineModal from './HelplineModal';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string, tag: string, image?: string, options?: { is_shadow?: boolean, is_open?: boolean }) => Promise<{ success: boolean; safety_warning?: boolean; error?: string } | void>;
    deviceId: string;
}

export default function ComposeModal({ isOpen, onClose, onSubmit, deviceId }: ComposeModalProps) {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showHelpline, setShowHelpline] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Features State
    const [isShadow, setIsShadow] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const charCount = content.length;
    const isValid = charCount > 0 && charCount <= 280;

    useEffect(() => {
        if (isOpen && !showCamera) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, showCamera]);

    const handleGalleryClick = () => {
        galleryInputRef.current?.click();
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = 1200;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                setImage(base64);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Updated onSubmit to handle new flags
            const result = await (onSubmit as any)(content, '#General', image || undefined, {
                is_shadow: isShadow,
                is_open: false
            });

            if (result && result.safety_warning) {
                setShowHelpline(true);
            }

            if (result && result.success) {
                setContent('');
                setImage(null);
                setIsShadow(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-dark-950 flex flex-col pt-10 px-6 sm:max-w-[480px] sm:mx-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={onClose} className="text-gray-400 font-bold hover:text-white transition">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting}
                            className="bg-brand-glow text-white px-8 py-2.5 rounded-full font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent shadow-[0_0_20px_rgba(139,92,246,0.4)] transition active:scale-95"
                        >
                            {isSubmitting ? 'Dropping...' : 'Post Drop'}
                        </button>
                    </div>

                    {/* Image Preview */}
                    {image && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-6 group border border-white/10 shadow-2xl">
                            <img src={image} alt="Captured" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setImage(null)}
                                    className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-110 transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    <textarea
                        ref={inputRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-48 bg-transparent text-2xl font-bold text-white placeholder-gray-700 resize-none focus:outline-none leading-tight"
                        placeholder="What's the tea? ☕️"
                        maxLength={280}
                    />

                    {/* Action Bar */}
                    <div className="flex flex-col gap-6 mt-4">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-3">
                                <button className="p-3 rounded-2xl bg-white/5 text-gray-500 hover:text-brand-glow hover:bg-white/10 transition border border-white/5">
                                    <Hash className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className={cn("p-3 rounded-2xl transition border", image ? "bg-brand-glow/20 border-brand-glow/50 text-brand-glow" : "bg-white/5 border-white/5 text-gray-500 hover:text-brand-glow hover:bg-white/10")}
                                >
                                    <Camera className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleGalleryClick}
                                    className="p-3 rounded-2xl bg-white/5 text-gray-500 hover:text-brand-glow hover:bg-white/10 transition border border-white/5"
                                >
                                    <Upload className="w-6 h-6" />
                                </button>
                                <input
                                    type="file"
                                    ref={galleryInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleGalleryChange}
                                />
                            </div>
                            <span className={`text-xs font-black font-mono tracking-widest ${charCount > 250 ? 'text-red-500' : 'text-gray-700'}`}>
                                {charCount}/280
                            </span>
                        </div>

                        <div className="grid grid-cols-1">
                            <button
                                onClick={() => setIsShadow(!isShadow)}
                                className={cn(
                                    "px-4 py-4 rounded-3xl border transition-all flex items-center justify-center gap-3",
                                    isShadow
                                        ? "bg-black border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        : "bg-white/5 border-white/5 text-gray-500"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border-2", isShadow ? "bg-white border-white" : "border-gray-700")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Shadow Drop</span>
                            </button>
                        </div>
                    </div>

                    {/* Posting Reassurance */}
                    <div className="mt-auto mb-8 text-center bg-white/5 p-4 rounded-3xl border border-white/5">
                        <div className="flex justify-center items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            <span>Total Anonymity Guaranteed</span>
                        </div>
                    </div>

                    {showCamera && (
                        <CameraCapture
                            onCapture={(base64) => {
                                setImage(base64);
                                setShowCamera(false);
                            }}
                            onCancel={() => setShowCamera(false)}
                        />
                    )}

                    <HelplineModal
                        isOpen={showHelpline}
                        onClose={() => {
                            setShowHelpline(false);
                            onClose();
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
