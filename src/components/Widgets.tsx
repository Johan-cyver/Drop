import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import Leaderboard from './Leaderboard';
import WarRoomWidget from './WarRoomWidget';

export default function Widgets() {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(20, 0, 0, 0);
            if (now > target) target.setDate(target.getDate() + 1);
            const diff = target.getTime() - now.getTime();
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, []);

    return (
        <aside className="hidden lg:flex lg:col-span-3 flex-col w-full h-screen sticky top-0 p-6 pt-8 gap-8 border-l border-white/5 bg-dark-950/30 backdrop-blur-xl z-50 overflow-y-auto scrollbar-hide">

            {/* Next Drop Countdown */}
            <div className="bg-gradient-to-br from-brand-start/10 to-brand-end/10 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-brand-glow animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-glow">Next Drop</span>
                </div>
                <div className="font-mono text-3xl font-bold text-white tracking-wider mb-1">
                    {timeLeft}
                </div>
                <p className="text-[10px] text-gray-500">Global refresh in sync.</p>
            </div>

            {/* College Leaderboard */}
            <Leaderboard />

            {/* War Room Territory Map */}
            <WarRoomWidget />

            <div className="mt-auto pt-6 text-center border-t border-white/5">
                <p className="text-[10px] text-gray-600 font-mono tracking-tighter">Safe. Anonymous. Encrypted.</p>
            </div>
        </aside>
    );
}
