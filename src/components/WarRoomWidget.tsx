'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WarRoomWidget() {
    const [stats, setStats] = useState<any[]>([]);
    const [topDog, setTopDog] = useState<any>(null);
    const [totalDrops, setTotalDrops] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/activity/dominance');
                const data = await res.json();
                if (data.dominance) {
                    setStats(data.dominance.slice(0, 3));
                    setTopDog(data.topDog);
                    setTotalDrops(data.totalDrops);
                }
            } catch (e) {
                console.error('Failed to fetch dominance', e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // 30s updates
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 animate-pulse bg-white/5">
            <div className="h-4 w-24 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
                <div className="h-8 w-full bg-white/5 rounded" />
                <div className="h-8 w-full bg-white/5 rounded" />
            </div>
        </div>
    );

    return (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-red-500/10 via-brand-start/5 to-transparent relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/20 blur-3xl rounded-full" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-500 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                        Live Territory Map
                    </h3>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-500 uppercase flex items-center gap-1">
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                    Active Conflict
                </div>
            </div>

            {topDog && (
                <div className="mb-6 relative z-10">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Territory Boss</p>
                    <div className="flex items-end gap-2">
                        <span className="text-lg font-black text-white leading-tight truncate max-w-[180px]">
                            {topDog.name}
                        </span>
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black mb-1">
                            <TrendingUp className="w-3 h-3" />
                            {topDog.percentage.toFixed(0)}% Control
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4 relative z-10">
                {stats.map((college, i) => (
                    <div key={college.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400 truncate pr-2 uppercase tracking-tighter italic">{college.name}</span>
                            <span className="text-white font-mono">{college.count} Drops</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${college.percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    i === 0 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                                        i === 1 ? "bg-brand-glow" : "bg-white/20"
                                )}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 relative z-10">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <p className="text-[9px] text-gray-500 leading-tight">
                    Each <span className="text-white font-bold">Drop</span> increases your campus territory. Rule the board to earn 2x DC.
                </p>
            </div>
        </div>
    );
}
