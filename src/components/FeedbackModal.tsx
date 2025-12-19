'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    deviceId: string;
}

export default function FeedbackModal({ isOpen, onClose, deviceId }: FeedbackModalProps) {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async () => {
        if (!message.trim()) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id: deviceId, message })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit feedback');
            }

            setStatus('success');
            setMessage('');
            setTimeout(() => {
                onClose();
                setStatus('idle');
            }, 2000);
        } catch (error) {
            setStatus('error');
            setErrorMsg(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card rounded-3xl p-8 w-full max-w-md relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-brand-glow/10 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-brand-glow" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Your Voice Matters</h2>
                                <p className="text-sm text-gray-400">Help us improve DROP</p>
                            </div>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Share your thoughts, ideas, or report issues..."
                            className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-glow/50 transition"
                            maxLength={1000}
                            disabled={status === 'loading' || status === 'success'}
                        />

                        <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500 font-mono">
                                {message.length}/1000
                            </span>
                            <button
                                onClick={handleSubmit}
                                disabled={!message.trim() || status === 'loading' || status === 'success'}
                                className="bg-brand-glow text-white px-6 py-2.5 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent shadow-[0_0_15px_rgba(139,92,246,0.4)] transition"
                            >
                                {status === 'loading' ? 'Sending...' : status === 'success' ? 'Sent! ✓' : 'Send Feedback'}
                            </button>
                        </div>

                        {status === 'error' && (
                            <p className="text-red-400 text-sm mt-4">{errorMsg}</p>
                        )}

                        <p className="text-xs text-gray-600 mt-6 text-center">
                            Your device ID: <span className="font-mono text-gray-500">{deviceId.slice(0, 8)}...</span>
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
