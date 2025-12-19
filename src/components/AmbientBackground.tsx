'use client';
import { motion } from 'framer-motion';

export default function AmbientBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-glow/15 blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-accent/10 blur-[100px] animate-pulse-slow" />
        </div>
    );
}
