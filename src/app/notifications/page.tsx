'use client';

import { useState, useEffect } from 'react';
import AmbientBackground from '@/components/AmbientBackground';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ComposeModal from '@/components/ComposeModal';
import { Bell, Heart, MessageCircle, Zap, MessageSquare, PlusCircle, Coins, X } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';
import FeedbackModal from '@/components/FeedbackModal';
import DropCoinIcon from '@/components/DropCoinIcon';

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'drop_posted': return <PlusCircle className="w-5 h-5" />;
        case 'upvote': return <Heart className="w-5 h-5 fill-current" />;
        case 'reaction': return <Zap className="w-5 h-5 fill-current" />;
        case 'coin_reward': return <DropCoinIcon size="sm" />;
        default: return <Bell className="w-5 h-5" />;
    }
};

const TypeColor = (type: string) => {
    switch (type) {
        case 'drop_posted': return 'bg-emerald-500/20 text-emerald-400';
        case 'upvote': return 'bg-rose-500/20 text-rose-400';
        case 'reaction': return 'bg-amber-500/20 text-amber-400';
        case 'coin_reward': return 'bg-brand-glow/10 text-brand-glow';
        default: return 'bg-white/5 text-gray-400';
    }
};

export default function NotificationsPage() {
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = (did: string) => {
        fetch(`/api/activity?device_id=${did}`)
            .then(res => res.json())
            .then(data => {
                if (data.notifications) setNotifications(data.notifications);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    const handleDelete = (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));
        fetch(`/api/activity/delete?id=${id}&device_id=${deviceId}`, { method: 'DELETE' })
            .catch(e => {
                console.error(e);
                showToast('Failed to delete notification', 'error');
                fetchNotifications(deviceId);
            });
    };

    useEffect(() => {
        let did = localStorage.getItem('device_id');
        if (!did) {
            did = crypto.randomUUID();
            localStorage.setItem('device_id', did);
        }
        setDeviceId(did);
        fetchNotifications(did);

        const interval = setInterval(() => fetchNotifications(did!), 10000);
        return () => clearInterval(interval);
    }, []);

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
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">Activity</h2>
                </div>

                <div className="p-4 space-y-4">
                    {loading ? (
                        <div className="text-center text-gray-500 py-10">Checking activity...</div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif: any) => (
                            <div key={notif.id} className="glass-card p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 group relative">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", TypeColor(notif.type))}>
                                    <TypeIcon type={notif.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-200 text-sm leading-relaxed mb-1 pr-6">
                                        {notif.message}
                                    </p>
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                                        {new Date(notif.time).toLocaleTimeString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(notif.id)}
                                    className="absolute top-4 right-4 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-600">
                            <p>No activity yet.</p>
                            <p className="text-xs mt-2">Drop something hot to get reactions.</p>
                        </div>
                    )}
                </div>
            </main>

            <Widgets />
            <MobileDock
                onCompose={() => setIsComposeOpen(true)}
                onFeedback={() => setIsFeedbackOpen(true)}
            />
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={async (content, tag, image) => {
                    const did = localStorage.getItem('device_id') || "";
                    const res = await fetch('/api/confess', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content, device_id: did, image })
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
                deviceId={deviceId || ""}
            />

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                deviceId={deviceId || ""}
            />
        </div>
    );
}
