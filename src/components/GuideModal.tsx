'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles, Coins, Users, Shield, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to The Drop",
            description: "A premium, safe space for your college secrets. Here's how to navigate the tea.",
            icon: Sparkles,
            color: "brand-glow"
        },
        {
            title: "Shadow Drops",
            description: "The most spicy secrets start blurred. Upvote them to unblur and reveal the content to everyone!",
            icon: Shield,
            color: "red-500"
        },
        {
            title: "The Tea Lounge",
            description: "Click the Zap icon on any drop to enter the live chat. Every drop has its own real-time lounge.",
            icon: Zap,
            color: "brand-glow"
        },
        {
            title: "Earn Coins",
            description: "Participate in the lounge and get upvotes to earn coins. Use them to unlock features or soon, convert to rewards.",
            icon: Coins,
            color: "yellow-500"
        }
    ];

    const currentStep = steps[step];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-dark-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="p-8 pt-12 flex flex-col items-center text-center">
                            <motion.div
                                key={step}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`w-20 h-20 rounded-3xl bg-${currentStep.color}/20 flex items-center justify-center mb-6 border border-${currentStep.color}/20`}
                            >
                                <currentStep.icon className={`w-10 h-10 text-${currentStep.color}`} />
                            </motion.div>

                            <motion.h2
                                key={`title-${step}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-black text-white mb-4 italic tracking-tight"
                            >
                                {currentStep.title}
                            </motion.h2>

                            <motion.p
                                key={`desc-${step}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-gray-400 leading-relaxed mb-8 px-2"
                            >
                                {currentStep.description}
                            </motion.p>

                            <div className="w-full flex items-center gap-3">
                                {step < steps.length - 1 ? (
                                    <button
                                        onClick={() => setStep(step + 1)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <span>Next</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 bg-brand-glow hover:bg-brand-accent text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-brand-glow/20"
                                    >
                                        Got it! 🚀
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-1.5 mt-6">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-brand-glow' : 'w-2 bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
