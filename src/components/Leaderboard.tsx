import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import DropCoinIcon from './DropCoinIcon';

export default function Leaderboard({ compact = false }: { compact?: boolean }) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/colleges/leaderboard')
            .then(res => res.json())
            .then(data => setLeaderboard(data))
            .catch(err => console.error('Failed to fetch leaderboard', err));
    }, []);

    return (
        <div className={cn("glass-panel rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/5 to-transparent w-full overflow-hidden", compact && "p-4")}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-glow">
                    Drop Coin
                </h3>
                {!compact && <div className="px-2 py-0.5 rounded-full bg-brand-glow/10 border border-brand-glow/20 text-[8px] font-black text-brand-glow uppercase">Real-time</div>}
            </div>

            <div className="space-y-4 w-full">
                {leaderboard.map((college, i) => (
                    <div key={college.id} className="flex items-center gap-3 group w-full min-w-0">
                        <div className={cn(
                            "w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black",
                            i === 0 ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]" :
                                i === 1 ? "bg-gray-300 text-black" :
                                    i === 2 ? "bg-orange-500 text-black" : "bg-white/5 text-gray-500"
                        )}>
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2 overflow-hidden">
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-200 text-xs truncate">
                                    {college.name}
                                </h4>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">{college.student_count} Members</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-[10px] font-black text-brand-glow flex items-center gap-1 justify-end uppercase whitespace-nowrap">
                                    {(parseInt(college.total_wealth || '0') / 1000).toFixed(1)}K <DropCoinIcon size="xs" />
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
