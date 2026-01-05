import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrendingTopics({ compact = false }: { compact?: boolean }) {
    const [trending, setTrending] = useState<{ tag: string, count: number }[]>([]);

    useEffect(() => {
        fetch('/api/trending')
            .then(res => res.json())
            .then(data => {
                if (data.tags) setTrending(data.tags);
            })
            .catch(err => console.error('Failed to fetch trending widgets', err));
    }, []);

    return (
        <div className={cn("glass-panel rounded-2xl p-6 border border-white/5", compact && "p-4")}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Trending Spice
                </h3>
                <Quote className="w-4 h-4 text-gray-600" />
            </div>

            <div className="space-y-5">
                {trending.length > 0 ? trending.map((topic, i) => (
                    <div key={topic.tag} className="flex items-center justify-between group cursor-pointer">
                        <div>
                            <h4 className="font-bold text-gray-200 group-hover:text-brand-glow transition-colors text-sm">
                                #{topic.tag}
                            </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-gray-500">{topic.count}</span>
                        </div>
                    </div>
                )) : (
                    <p className="text-xs text-gray-500 italic text-center py-4">Brewing fresh tea...</p>
                )}
            </div>
        </div>
    );
}
