'use client';

import { useState, useEffect, Suspense } from 'react';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ConfessionCard, { Post } from '@/components/ConfessionCard';
import ComposeModal from '@/components/ComposeModal';
import { Search, Hash, TrendingUp, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { showToast } from '@/components/NotificationToast';

function DiscoverContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<Post[]>([]);
    const [trendingTags, setTrendingTags] = useState<{ tag: string, count: number }[]>([]);
    const [openDrops, setOpenDrops] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        if (did) setDeviceId(did);
        fetchTrending();
        fetchOpenDrops(did || '');
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, []);

    const fetchTrending = async () => {
        try {
            const res = await fetch('/api/discover?trending=true');
            const data = await res.json();
            if (data.tags) setTrendingTags(data.tags);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchOpenDrops = async (did: string) => {
        try {
            const res = await fetch(`/api/discover?open=true&device_id=${did}`);
            const data = await res.json();
            if (data.results) setOpenDrops(data.results);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSearch = async (term: string) => {
        if (!term.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/discover?q=${encodeURIComponent(term)}&device_id=${deviceId}`);
            const data = await res.json();
            if (data.results) setResults(data.results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (id: string, val: number) => {
        const updated = results.map(p => {
            if (p.id !== id) return p;
            const currentVote = p.myVote || 0;
            let newVote = currentVote === val ? 0 : val;
            let voteDiff = newVote - currentVote;
            return { ...p, upvotes: p.upvotes + voteDiff, myVote: newVote };
        });
        setResults(updated);
        // Fire API
        await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confession_id: id, value: val, device_id: deviceId })
        });
    };

    return (
        <div className="h-full w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-8 relative z-10 sm:px-6 lg:px-8">
            <AmbientBackground />
            <Navbar onCompose={() => setIsComposeOpen(true)} />

            <main className="flex-1 lg:col-span-6 w-full max-w-[480px] lg:max-w-none mx-auto flex flex-col h-full bg-dark-950/50 lg:bg-transparent lg:border-x lg:border-white/5 relative shadow-2xl lg:shadow-none min-h-screen">

                {/* Search Header */}
                <div className="p-6 sticky top-0 z-20 bg-dark-950/80 backdrop-blur-md border-b border-white/5">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Discover</h2>
                    <div className="relative group">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Find a college, tag, or topic..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-glow/50 focus:bg-white/10 transition-all"
                        />
                        <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-glow transition-colors" />
                    </div>
                </div>

                <div className="p-4 lg:p-6 space-y-8">

                    {/* Global Open Drops Section */}
                    {results.length === 0 && !loading && openDrops.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4 text-brand-glow px-2">
                                <Zap className="w-4 h-4 fill-current" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Global Open Drops</h3>
                            </div>
                            <div className="space-y-4">
                                {openDrops.map(post => (
                                    <ConfessionCard
                                        key={post.id}
                                        post={post}
                                        onVote={handleVote}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trending Section (Only show if no search results yet) */}
                    {results.length === 0 && !loading && (
                        <section>
                            <div className="flex items-center gap-2 mb-4 text-brand-glow px-2">
                                <TrendingUp className="w-4 h-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Trending Tags</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {trendingTags.length > 0 ? trendingTags.map(t => (
                                    <button
                                        key={t.tag}
                                        onClick={() => { setQuery(t.tag); handleSearch(t.tag); }}
                                        className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <span className="text-brand-glow">#</span>
                                        {t.tag.replace('#', '')}
                                        <span className="bg-black/20 px-1.5 rounded text-[10px] text-gray-500">{t.count}</span>
                                    </button>
                                )) : (
                                    <p className="text-gray-500 text-sm italic px-2">No trends yet. Be the first.</p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Results Feed */}
                    <section className="space-y-4">
                        {loading && <div className="text-center text-brand-glow animate-pulse">Searching...</div>}

                        {results.length > 0 && (
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 px-2">
                                Results
                            </h3>
                        )}

                        {results.map(post => (
                            <ConfessionCard key={post.id} post={post} onVote={handleVote} />
                        ))}
                    </section>
                </div>
            </main >

            <Widgets />
            <MobileDock onCompose={() => setIsComposeOpen(true)} />
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={async (content, tag, image, options) => {
                    const res = await fetch('/api/confess', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content, device_id: deviceId, image, ...options })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setIsComposeOpen(false);
                        showToast('Confession dropped!', 'success');
                        window.location.href = '/';
                        return { success: true, safety_warning: data.safety_warning };
                    } else {
                        showToast(data.error, 'error');
                        return { success: false, safety_warning: data.safety_warning };
                    }
                }}
                deviceId={deviceId}
            />
        </div >
    );
}

export default function DiscoverPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-dark-950 flex items-center justify-center text-white/50">Loading Discover...</div>}>
            <DiscoverContent />
        </Suspense>
    );
}
