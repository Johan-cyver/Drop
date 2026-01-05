import { Quote, Timer, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Widgets() {
    const [timeLeft, setTimeLeft] = useState('');
    const [trending, setTrending] = useState<{ tag: string, count: number }[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

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

        fetch('/api/colleges/leaderboard')
            .then(res => res.json())
            .then(data => setLeaderboard(data))
            .catch(err => console.error('Failed to fetch leaderboard', err));
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

        </div>
            </div >

        {/* College Leaderboard */ }
        < div className = "glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/5 to-transparent" >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-glow">
                        College Supremacy
                    </h3>
                    <div className="px-2 py-0.5 rounded-full bg-brand-glow/10 border border-brand-glow/20 text-[8px] font-black text-brand-glow uppercase">Real-time</div>
                </div>

                <div className="space-y-4">
                    {leaderboard.map((college, i) => (
                        <div key={college.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                    i === 0 ? "bg-yellow-500 text-black" : 
                                    i === 1 ? "bg-gray-300 text-black" :
                                    i === 2 ? "bg-orange-500 text-black" : "bg-white/5 text-gray-500"
                                )}>
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-200 text-xs truncate max-w-[120px]">
                                        {college.name}
                                    </h4>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{college.student_count} Members</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-brand-glow block">
                                    ${(parseInt(college.total_wealth || '0') / 1000).toFixed(1)}K
                                </span>
                                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Gold</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div >

        <div className="mt-auto text-center">
            <p className="text-[10px] text-gray-600 font-mono">Safe. Anonymous. Encrypted.</p>
        </div>
        </aside >
    );
}
