'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import ConfessionCard, { Post } from '@/components/ConfessionCard';
import MobileDock from '@/components/MobileDock';
import { User, MapPin, Calendar, ArrowLeft, MessageSquare } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import ComposeModal from '@/components/ComposeModal';
import FeedbackModal from '@/components/FeedbackModal';

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const handle = params.handle as string;

    const [profile, setProfile] = useState<any>(null);
    const [drops, setDrops] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        let did = localStorage.getItem('device_id');
        if (!did) {
            did = crypto.randomUUID();
            localStorage.setItem('device_id', did);
        }
        setDeviceId(did);
        fetchProfile(did);
    }, [handle]);

    const fetchProfile = async (did: string) => {
        try {
            const res = await fetch(`/api/profile/${handle}?device_id=${did}`);
            const data = await res.json();
            if (res.ok) {
                setProfile(data.user);
                setDrops(data.drops);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (id: string, val: number) => {
        const updated = drops.map(p => {
            if (p.id !== id) return p;
            const currentVote = p.myVote || 0;
            let newVote = currentVote === val ? 0 : val;
            let voteDiff = newVote - currentVote;
            return { ...p, upvotes: p.upvotes + voteDiff, myVote: newVote };
        });
        setDrops(updated);
        await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confession_id: id, value: val, device_id: deviceId })
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-glow/20 border-t-brand-glow rounded-full animate-spin" />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
            <AmbientBackground />
            <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Ghosted.</h1>
            <p className="text-gray-500 mb-8">This identity doesn't exist in our logs.</p>
            <button onClick={() => router.back()} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen w-full relative bg-dark-950 text-white pb-32">
            <AmbientBackground />
            <AmbientBackground />
            <Navbar
                onCompose={() => setIsComposeOpen(true)}
                onFeedback={() => setIsFeedbackOpen(true)}
            />

            <main className="max-w-[480px] mx-auto px-6 pt-10 relative z-10">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Back</span>
                </button>

                {/* Profile Detail */}
                <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden mb-12">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-glow/10 blur-[100px] rounded-full -mr-20 -mt-20" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden mb-6 shadow-2xl">
                            <img
                                src={profile.avatar?.startsWith('data:') ? profile.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.handle}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">{profile.name}</h1>
                        <p className="text-brand-glow font-bold text-lg mb-6 tracking-wide">@{profile.handle}</p>

                        <div className="flex flex-col gap-3 w-full max-w-[240px]">
                            <div className="flex items-center gap-3 text-gray-500 text-sm bg-white/5 p-3 rounded-2xl border border-white/5">
                                <MapPin className="w-4 h-4 text-brand-glow" />
                                <span className="truncate">{profile.college_name || 'Anonymous College'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500 text-sm bg-white/5 p-3 rounded-2xl border border-white/5">
                                <Calendar className="w-4 h-4 text-brand-glow" />
                                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Drops */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-glow animate-pulse" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Public Logs ({drops.length})</h3>
                    </div>

                    {drops.length > 0 ? (
                        drops.map(post => (
                            <ConfessionCard key={post.id} post={post} onVote={handleVote} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5 opacity-50">
                            <User className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-600">No public tea dropped yet.</p>
                        </div>
                    )}
                </div>
            </main>

            <MobileDock
                onCompose={() => setIsComposeOpen(true)}
                onFeedback={() => setIsFeedbackOpen(true)}
            />
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={async (content, tag, image, options) => {
                    const res = await fetch('/api/confess', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content, device_id: deviceId, image, ...options })
                    });
                    if (res.ok) {
                        setIsComposeOpen(false);
                        fetchProfile(deviceId);
                    }
                }}
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
