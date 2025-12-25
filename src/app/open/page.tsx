'use client';

import { useState, useEffect } from 'react';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ConfessionCard, { Post } from '@/components/ConfessionCard';
import ComposeModal from '@/components/ComposeModal';
import { Zap, Sparkles, MessageSquare } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';
import FeedbackModal from '@/components/FeedbackModal';

export default function OpenDropsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        if (did) {
            setDeviceId(did);
            fetchOpenDrops(did);
        } else {
            const newId = crypto.randomUUID();
            localStorage.setItem('device_id', newId);
            setDeviceId(newId);
            fetchOpenDrops(newId);
        }
    }, []);

    const fetchOpenDrops = async (did: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/discover?mode=open_drops&device_id=${did}`);
            const data = await res.json();
            if (data.results) {
                setPosts(data.results);
            }
        } catch (e) {
            console.error('Failed to fetch open drops', e);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (id: string, val: number) => {
        const updated = posts.map(p => {
            if (p.id !== id) return p;
            const currentVote = p.myVote || 0;
            let newVote = currentVote === val ? 0 : val;
            let voteDiff = newVote - currentVote;
            return { ...p, upvotes: p.upvotes + voteDiff, myVote: newVote };
        });
        setPosts(updated);

        await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confession_id: id, value: val, device_id: deviceId })
        });
    };

    const handleSubmit = async (content: string, tag: string, image?: string, options?: any) => {
        const res = await fetch('/api/confess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, device_id: deviceId, image, ...options })
        });
        const data = await res.json();
        if (res.ok) {
            setIsComposeOpen(false);
            showToast('Open Drop posted!', 'success');
            fetchOpenDrops(deviceId);
            return { success: true, safety_warning: data.safety_warning };
        } else {
            showToast(data.error, 'error');
            return { success: false, safety_warning: data.safety_warning };
        }
    };

    return (
        <div className="h-full w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-8 relative z-10 sm:px-6 lg:px-8">
            <AmbientBackground />
            <Navbar
                onCompose={() => setIsComposeOpen(true)}
                onFeedback={() => setIsFeedbackOpen(true)}
            />

            <main className="flex-1 lg:col-span-6 w-full max-w-[480px] lg:max-w-none mx-auto flex flex-col h-full bg-dark-950/50 lg:bg-transparent lg:border-x lg:border-white/5 relative shadow-2xl lg:shadow-none min-h-screen">

                {/* Header */}
                <div className="p-6 sticky top-0 z-20 bg-dark-950/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-glow/10 flex items-center justify-center border border-brand-glow/20">
                                <Zap className="w-5 h-5 text-brand-glow fill-current" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">Open Drops</h1>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-glow opacity-80">Global Identity Feed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Sparkles className="w-3 h-3 text-brand-glow" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public Tea</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                            <div className="w-12 h-12 bg-white/5 rounded-full mb-4" />
                            <div className="h-4 w-32 bg-white/5 rounded mb-2" />
                            <div className="h-3 w-48 bg-white/5 rounded opacity-50" />
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <ConfessionCard
                                    key={post.id}
                                    post={post}
                                    onVote={handleVote}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center glass-panel rounded-3xl border border-white/5 mx-2">
                            <div className="text-5xl mb-6">🎭</div>
                            <h3 className="text-xl font-bold text-white mb-2">The stage is empty</h3>
                            <p className="text-sm text-gray-500 max-w-[240px]">Be the first to reveal yourself and drop some global tea.</p>
                            <button
                                onClick={() => setIsComposeOpen(true)}
                                className="mt-8 px-8 py-3 bg-brand-glow/20 border border-brand-glow/30 rounded-2xl text-brand-glow font-bold text-sm hover:bg-brand-glow/30 transition-all"
                            >
                                Start the Show
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-24 lg:h-10" />
            </main>

            <Widgets />
            <MobileDock
                onCompose={() => setIsComposeOpen(true)}
                onFeedback={() => setIsFeedbackOpen(true)}
            />

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={handleSubmit}
                deviceId={deviceId}
            />

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                deviceId={deviceId}
            />
        </div>
    );
}
