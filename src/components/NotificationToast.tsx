'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics } from '@/lib/haptics';
import CoinBurst from './CoinBurst';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export default function NotificationToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [burstTrigger, setBurstTrigger] = useState(false);

    useEffect(() => {
        const handleToast = (e: any) => {
            const { message, type = 'info' } = e.detail;
            const id = Math.random().toString(36).substr(2, 9);
            setToasts(prev => [...prev, { id, message, type }]);

            // Haptics, Sound & Visual Economy
            const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
            const isReward = type === 'success' ||
                message.includes('reward') ||
                message.includes('DC') ||
                message.includes('earned') ||
                message.includes('+');

            if (isReward) {
                Haptics.success();
                setBurstTrigger(false);
                setTimeout(() => setBurstTrigger(true), 10);
            } else if (type === 'error') {
                Haptics.error();
            } else {
                Haptics.light();
            }

            if (soundEnabled && isReward) {
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Premium coin sound
                    audio.volume = 0.4;
                    audio.play().catch(e => console.log('Audio play blocked:', e));
                } catch (err) {
                    console.log('Audio not supported');
                }
            }

            setTimeout(() => {
                removeToast(id);
            }, 5000);
        };

        window.addEventListener('app-toast', handleToast);
        return () => window.removeEventListener('app-toast', handleToast);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={cn(
                            "pointer-events-auto flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl relative overflow-hidden group",
                            toast.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-400",
                            toast.type === 'warning' && "bg-orange-500/10 border-orange-500/20 text-orange-400",
                            toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
                            toast.type === 'info' && "bg-brand-glow/10 border-brand-glow/20 text-brand-glow"
                        )}
                    >
                        {/* Progress Bar */}
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                            className={cn(
                                "absolute bottom-0 left-0 h-0.5 opacity-50",
                                toast.type === 'success' && "bg-green-500",
                                toast.type === 'warning' && "bg-orange-500",
                                toast.type === 'error' && "bg-red-500",
                                toast.type === 'info' && "bg-brand-glow"
                            )}
                        />

                        <div className="pt-0.5">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                            {toast.type === 'info' && <Bell className="w-5 h-5" />}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-bold leading-tight">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/20 hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
            <CoinBurst trigger={burstTrigger} />
        </div>
    );
}

// Utility to trigger toasts
export const showToast = (message: string, type: ToastType = 'info') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
    }
};
