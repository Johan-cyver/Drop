'use client';

import { useState, useEffect } from 'react';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ConfessionCard, { Post } from '@/components/ConfessionCard';
import ComposeModal from '@/components/ComposeModal';
import { User, Award, Calendar } from 'lucide-react';
import { formatTime } from '@/lib/utils';

export default function MyLogicPage() {
    const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);

    // Restored State
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        if (did) setDeviceId(did);
        fetchProfile(did);

        // Load Saved
        const saved = JSON.parse(localStorage.getItem('my_echoes') || '[]');
        setSavedPosts(saved);

        // Listen for storage changes
        const handleStorage = () => {
            const updated = JSON.parse(localStorage.getItem('my_echoes') || '[]');
            setSavedPosts(updated);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const fetchProfile = async (did?: string | null) => {
        if (!did) return;
        try {
            const res = await fetch(`/api/user/profile?device_id=${did}`);
            const data = await res.json();
            if (data.user) setUser(data.user);
            if (data.posts) {
                setPosts(data.posts.map((p: any) => ({ ...p, myVote: 0 })));
            }
            if (data.stats) setStats(data.stats);
        } catch (e) {
            console.error(e);
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
    }

    return (
        <div className="h-full w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-8 relative z-10 sm:px-6 lg:px-8">
            <AmbientBackground />
            <Navbar onCompose={() => setIsComposeOpen(true)} />

            <main className="flex-1 lg:col-span-6 w-full max-w-[480px] lg:max-w-none mx-auto flex flex-col h-full bg-dark-950/50 lg:bg-transparent lg:border-x lg:border-white/5 relative shadow-2xl lg:shadow-none min-h-screen">

                {/* Header Profile */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-brand-start/10 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center shadow-lg shadow-brand-glow/20 overflow-hidden">
                            {user?.avatar?.startsWith('data:') ? (
                                <img src={user.avatar} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white">{user?.avatar || 'Me'}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{user?.name || 'My Logic'}</h2>
                            <div className="flex flex-col gap-4 text-xs font-mono text-gray-400">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 flex-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Impact</span>
                                        <span className="text-2xl font-bold font-mono text-white">{stats?.karma || 0}</span>
                                        <span className="text-[10px] text-gray-400">Reactions Triggered</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 flex-1 tooltip" title="Used to unlock special features (Coming Soon)">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Drop Coins</span>
                                        <span className="text-2xl font-bold font-mono text-white">{stats?.karma ? stats.karma * 10 : 100}</span>
                                        <span className="text-[10px] text-gray-400">Available</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    <span>Joined {stats ? new Date(stats.joinedAt).toLocaleDateString() : '...'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'created' ? 'text-white border-b-2 border-brand-glow bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        My Drops ({posts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'saved' ? 'text-white border-b-2 border-brand-glow bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Echoes Library ({savedPosts.length})
                    </button>
                </div>

                <div className="p-4 lg:p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500 animate-pulse">Checking your history...</div>
                    ) : (activeTab === 'created' ? (
                        posts.length > 0 ? (
                            posts.map(post => (
                                <ConfessionCard key={post.id} post={post} onVote={handleVote} />
                            ))
                        ) : (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <User className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-gray-400">You haven't dropped anything yet.</p>
                                <button onClick={() => setIsComposeOpen(true)} className="text-brand-glow hover:underline text-sm font-medium">
                                    Start a ripple effect &rarr;
                                </button>
                            </div>
                        )
                    ) : (
                        // Saved / Echoes Tab
                        savedPosts.length > 0 ? (
                            savedPosts.map(post => (
                                <div key={post.id} className="opacity-90 hover:opacity-100 transition">
                                    {/* Reuse card but maybe imply it's read-only/saved? No, spec says view/share. */}
                                    <ConfessionCard post={post} onVote={handleVote} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <Award className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-gray-400">Your Echoes Library is empty.</p>
                                <p className="text-xs text-gray-600">Save drops you want to keep forever.</p>
                            </div>
                        )
                    ))}
                </div>
            </main>

            <Widgets />
            <MobileDock onCompose={() => setIsComposeOpen(true)} />
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={() => fetchProfile(deviceId)}
                deviceId={deviceId}
            />
        </div>
    );
}
