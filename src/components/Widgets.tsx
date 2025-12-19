import { useState, useEffect } from 'react';
import { Quote, Timer } from 'lucide-react';

export default function Widgets() {
    const [timeLeft, setTimeLeft] = useState('');
    const [trending, setTrending] = useState<{ tag: string, count: number }[]>([]);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();
            // Set target to next 8 PM
            target.setHours(20, 0, 0, 0);
            if (now > target) {
                target.setDate(target.getDate() + 1);
            }

            const diff = target.getTime() - now.getTime();
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `);
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Init
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch('/api/trending')
            .then(res => res.json())
            .then(data => {
                if (data.tags) setTrending(data.tags);
            })
            .catch(err => console.error('Failed to fetch trending widgets', err));
    }, []);

    return (
        <aside className="hidden lg:flex lg:col-span-3 flex-col w-full h-screen sticky top-0 p-6 pt-8 gap-8 border-l border-white/5 bg-dark-950/30 backdrop-blur-xl z-50">

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

            {/* Real Trending Topics */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        People are talking about this
                    </h3>
                    <Quote className="w-4 h-4 text-gray-600" />
                </div>

                <div className="space-y-5">
                    {trending.length > 0 ? trending.map((topic, i) => (
                        <div key={topic.tag} className="flex items-center justify-between group cursor-pointer">
                            <div>
                                <h4 className="font-bold text-gray-200 group-hover:text-brand-glow transition-colors text-sm">
                                    {topic.tag}
                                </h4>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={`w - 1.5 h - 1.5 rounded - full ${i === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'} `} />
                                <span className="text-[10px] font-mono text-gray-500">{topic.count}</span>
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs text-gray-500 italic">No trending topics yet.</p>
                    )}
                </div>
            </div>

            <div className="mt-auto text-center">
                <p className="text-[10px] text-gray-600 font-mono">Safe. Anonymous. Encrypted.</p>
            </div>
        </aside>
    );
}
