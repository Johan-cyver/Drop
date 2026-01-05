'use client';
import { useState, useEffect } from 'react';
import MobileDock from '@/components/MobileDock';
import Leaderboard from '@/components/Leaderboard';
import TrendingTopics from '@/components/TrendingTopics';
import { TrendingUp, Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TrendingPage() {
    return (
        <div className="min-h-screen bg-dark-950 text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 px-6 py-6 border-b border-white/5 bg-dark-950/80 backdrop-blur-3xl flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/5 transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="font-black text-2xl tracking-tighter">Trending</h1>
            </header>

            <main className="flex-1 p-6 space-y-8 pb-32 max-w-[480px] mx-auto w-full">
                {/* Visual Highlights/Quick Stats could go here */}
                <div className="flex items-center gap-3 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-brand-glow/20 flex items-center justify-center text-brand-glow">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Today's Heat</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Ranking & Topics</p>
                    </div>
                </div>

                <TrendingTopics />

                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Leaderboard</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">College Wealth Rank</p>
                        </div>
                    </div>
                    <Leaderboard />
                </div>
            </main>

            <MobileDock onCompose={() => { }} onFeedback={() => { }} />
        </div>
    );
}
