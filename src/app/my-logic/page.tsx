'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ConfessionCard, { Post } from '@/components/ConfessionCard';
import ComposeModal from '@/components/ComposeModal';
import { User, Award, Calendar, GraduationCap, Edit3, Camera, Sparkles, X, Upload } from 'lucide-react';
import { formatTime, cn } from '@/lib/utils';
import { showToast } from '@/components/NotificationToast';

export default function MyLogicPage() {
    const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);

    // Restored State
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const AVATARS = ['👻', '👽', '💀', '🤖', '👾', '🦊', '🌚', '🧛', '🧙', '🥷'];

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
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center shadow-lg shadow-brand-glow/20 overflow-hidden">
                                {user?.avatar?.startsWith('data:') ? (
                                    <img src={user.avatar} alt="Me" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">{user?.avatar || 'Me'}</span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-dark-900 border border-white/10 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl hover:bg-brand-glow/20"
                            >
                                <Edit3 className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-2xl font-bold text-white">{user?.name || 'My Logic'}</h2>
                                <button
                                    onClick={() => {
                                        const newName = prompt("New display name:", user?.name);
                                        if (newName) {
                                            fetch('/api/user/update-profile', {
                                                method: 'POST',
                                                body: JSON.stringify({ device_id: deviceId, name: newName })
                                            }).then(() => fetchProfile(deviceId));
                                        }
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-white transition"
                                >
                                    Edit
                                </button>
                            </div>
                            <p className="text-brand-glow font-mono text-xs mb-3 flex items-center gap-2">
                                @{user?.handle || 'drop_member'}
                                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-500 font-black tracking-widest border border-white/5">
                                    ID: {deviceId.slice(0, 8).toUpperCase()}
                                </span>
                            </p>
                            <div className="flex flex-col gap-4 text-xs font-mono text-gray-400">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 flex-1 hover:bg-white/10 transition-all cursor-default">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-brand-glow" /> Impact
                                        </span>
                                        <span className="text-2xl font-bold font-mono text-white">{stats?.karma || 0}</span>
                                        <span className="text-[10px] text-gray-400">Reactions Triggered</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 flex-1 hover:bg-white/10 transition-all cursor-default">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Drop Coins</span>
                                        <span className="text-2xl font-bold font-mono text-white">{stats?.coins || 100}</span>
                                        <span className="text-[10px] text-gray-400">Available</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4 text-brand-glow" />
                                        <span>{user?.college_name || 'Member College'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                        <span>Joined {stats ? new Date(stats.joinedAt).toLocaleDateString() : '...'}</span>
                                    </div>
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
                onSubmit={async (content, tag, image) => {
                    const res = await fetch('/api/confess', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content, device_id: deviceId, image })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        fetchProfile(deviceId);
                        setIsComposeOpen(false);
                        showToast('Confession dropped!', 'success');
                        return { success: true, safety_warning: data.safety_warning };
                    } else {
                        showToast(data.error, 'error');
                        return { success: false, safety_warning: data.safety_warning };
                    }
                }}
                deviceId={deviceId}
            />

            {/* Avatar Selection Modal */}
            <AnimatePresence>
                {isAvatarModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsAvatarModalOpen(false)}
                                className="absolute top-6 right-6 text-gray-500 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">Change Avatar</h3>
                                <p className="text-xs text-gray-500">How do you want to be seen today?</p>
                            </div>

                            <div className="grid grid-cols-5 gap-3 mb-8">
                                {AVATARS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={async () => {
                                            setIsUpdating(true);
                                            await fetch('/api/user/update-profile', {
                                                method: 'POST',
                                                body: JSON.stringify({ device_id: deviceId, avatar: emoji })
                                            });
                                            fetchProfile(deviceId);
                                            setIsAvatarModalOpen(false);
                                            setIsUpdating(false);
                                            showToast('Avatar updated!', 'success');
                                        }}
                                        className={cn(
                                            "w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all",
                                            user?.avatar === emoji ? "bg-brand-glow text-white shadow-lg scale-110" : "bg-white/5 hover:bg-white/10 text-gray-400"
                                        )}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>

                            <p className="text-[9px] text-center text-gray-600 uppercase tracking-[0.2em] font-black">
                                Select an emoji to update instantly
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
