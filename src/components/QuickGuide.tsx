'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles, Coins, Users, Shield, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QuickGuide({ isOpen, onClose }: QuickGuideProps) {
    const features = [
        {
            icon: Zap,
            title: "Shadow Drops",
            description: "Post blurred tea that only reveals once it hits an upvote threshold, or users spend Drop Coins to 'Peek'.",
            color: "text-brand-glow",
            bg: "bg-brand-glow/10"
        },
        {
            icon: Coins,
            title: "Drop Coins",
            description: "Earn 100 Drop Coins for every 1 Impact point. Upvote, chat, and react to gain wealth. Spend it on word peeks or premium reveals.",
            color: "text-yellow-500",
            bg: "bg-yellow-500/10"
        },
        {
            icon: Heart,
            title: "The Pulse",
            description: "Real-time activity tracking. See who's watching a drop or typing in the Tea Lounge in live-time.",
            color: "text-red-500",
            bg: "bg-red-500/10"
        },
        {
            icon: TrendingUp,
            title: "Trending Page",
            description: "Battle for College Supremacy. Track which campus is the richest and see the hottest topics of the hour.",
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        },
        {
            icon: MessageSquare,
            title: "Tea Lounge",
            description: "A private chat room for every drop. Discuss the tea while it's hot, before it evaporates forever.",
            color: "text-indigo-400",
            bg: "bg-indigo-400/10"
        },
        {
            icon: Shield,
            title: "Total Anonymity",
            description: "We don't collect names or phone numbers. Your identity is a unique encrypted ID by default.",
            color: "text-green-400",
            bg: "bg-green-400/10"
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-[440px] bg-dark-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-brand-glow" />
                                <h2 className="font-black text-xl uppercase tracking-widest text-white">App Guide</h2>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            <div className="grid grid-cols-1 gap-4">
                                {features.map((f, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", f.bg, f.color)}>
                                            <f.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-sm text-white mb-1 uppercase tracking-tight">{f.title}</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed font-bold">{f.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-brand-glow/10 border border-brand-glow/20 p-5 rounded-3xl text-center space-y-2">
                                <p className="text-[10px] font-black text-brand-glow uppercase tracking-[0.2em]">Pro Tip</p>
                                <p className="text-xs text-white/80 font-bold leading-relaxed">
                                    "Drop Coins = Impact × 100. Use your Drop Coins to flex on the leaderboard."
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/5 border-t border-white/5">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition active:scale-95 shadow-xl"
                            >
                                Got it, let's play
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
