'use client';

import { useState, useEffect } from 'react';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ComposeModal from '@/components/ComposeModal';
import { Bell, Heart, MessageCircle, Zap } from 'lucide-react';

export default function NotificationsPage() {
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        if (did) {
            fetch(`/api/activity?device_id=${did}`)
                .then(res => res.json())
                .then(data => {
                    if (data.notifications) setNotifications(data.notifications);
                })
                .catch(e => console.error(e))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <div className="h-full w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-8 relative z-10 sm:px-6 lg:px-8">
            <AmbientBackground />
            <Navbar onCompose={() => { }} />

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
                            <div key={notif.id} className="glass-card p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-10 h-10 rounded-full bg-brand-glow/20 flex items-center justify-center text-brand-glow">
                                    <Heart className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-gray-200 text-sm leading-relaxed mb-1">
                                        {notif.message}
                                    </p>
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                                        {new Date(notif.time).toLocaleTimeString()}
                                    </span>
                                </div>
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
            <MobileDock onCompose={() => setIsComposeOpen(true)} />
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={() => { }}
                deviceId=""
            />
        </div>
    );
}
