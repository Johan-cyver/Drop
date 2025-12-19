'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Hash, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CameraCapture from './CameraCapture';
import HelplineModal from './HelplineModal';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string, tag: string, image?: string) => Promise<{ success: boolean; safety_warning?: boolean; error?: string } | void>;
    deviceId: string;
}

export default function ComposeModal({ isOpen, onClose, onSubmit, deviceId }: ComposeModalProps) {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showHelpline, setShowHelpline] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const charCount = content.length;
    const isValid = charCount > 0 && charCount <= 280;

    useEffect(() => {
        if (isOpen && !showCamera) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, showCamera]);

    const handleSubmit = async () => {
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await onSubmit(content, '#General', image || undefined);

            if (result && result.safety_warning) {
                setShowHelpline(true);
            }

            if (result && result.success) {
                setContent('');
                setImage(null);
                // We don't close immediately if safety warning is shown? 
                // Actually, onSubmit in page.tsx already closes on success.
                // If safety_warning is true, we should probably keep ComposeModal open but hidden under Helpline?
                // Or just close ComposeModal and show Helpline over the Feed.
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
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid}
                            className="bg-brand-glow text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent shadow-[0_0_15px_rgba(139,92,246,0.4)] transition"
                        >
                            Post
                        </button>
                    </div>

                    {image && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-6 group">
                            <img src={image} alt="Captured" className="w-full h-full object-cover" />
                            <button
                                onClick={() => setImage(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <textarea
                        ref={inputRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-64 bg-transparent text-2xl font-light text-white placeholder-gray-600 resize-none focus:outline-none leading-normal"
                        placeholder="What's the tea? ☕️"
                        maxLength={280}
                    />

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                            <button className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-brand-glow transition">
                                <Hash className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowCamera(true)}
                                className={cn("p-2 rounded-full bg-white/5 transition", image ? "text-brand-glow" : "text-gray-400 hover:text-brand-glow")}
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>
                        <span className={`text-sm font-mono ${charCount > 250 ? 'text-red-500' : 'text-gray-600'}`}>
                            {charCount}/280
                        </span>
                    </div>

                    {/* Posting Reassurance */}
                    <div className="mt-auto mb-8 text-center space-y-2">
                        <div className="flex justify-center items-center gap-2 text-gray-500 text-xs">
                            <ShieldCheck className="w-3 h-3" />
                            <span>No username. No profile. No one can trace this to you.</span>
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
