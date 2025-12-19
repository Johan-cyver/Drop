'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Heart, Shield, X, MessageSquare, LifeBuoy } from 'lucide-react';

interface HelplineModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RESOURCES = [
    {
        name: "National Suicide Prevention LifeLine",
        number: "988",
        desc: "24/7, free and confidential support for people in distress."
    },
    {
        name: "Crisis Text Line",
        number: "741741",
        desc: "Text HOME to 741741 to connect with a Crisis Counselor."
    },
    {
        name: "Vandrevala Foundation (India)",
        number: "9999666555",
        desc: "24/7 helpline for mental health support in India."
    }
];

export default function HelplineModal({ isOpen, onClose }: HelplineModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-gradient-to-b from-dark-900 to-black border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 left-0 w-full h-full bg-brand-glow/5 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                    <Heart className="w-10 h-10 text-red-500 animate-pulse fill-red-500/20" />
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2 italic tracking-tighter uppercase">You are not alone.</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Our systems detected words that suggest you might be going through a tough time. It takes strength to speak up, and there are people who want to listen.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {RESOURCES.map((res) => (
                                    <div key={res.name} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-glow/30 transition-all group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{res.name}</span>
                                            <Phone className="w-3 h-3 text-brand-glow opacity-50 group-hover:opacity-100" />
                                        </div>
                                        <div className="text-lg font-mono font-black text-white mb-1">{res.number}</div>
                                        <p className="text-[10px] text-gray-400 leading-tight">{res.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => window.open('https://www.google.com/search?q=helpline+near+me', '_blank')}
                                    className="w-full py-4 rounded-2xl bg-brand-glow text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-glow/20 flex items-center justify-center gap-2"
                                >
                                    <LifeBuoy className="w-4 h-4" />
                                    Find More Resources
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                >
                                    Close
                                </button>
                            </div>

                            <p className="text-center text-[9px] text-gray-600 mt-6 uppercase tracking-widest font-bold opacity-50">
                                This is an automated safety check &bull; Your privacy remains anonymous
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
