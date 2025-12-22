'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import MobileDock from '@/components/MobileDock';
import ConfessionCard, { Post } from '@/components/ConfessionCard';
import ComposeModal from '@/components/ComposeModal';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CommentSection from '@/components/CommentSection';
import { showToast } from '@/components/NotificationToast';

export default function SingleConfessionPage({ params }: { params: { id: string } }) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        if (did) setDeviceId(did);
        fetchPost(did || undefined);
    }, [params.id]);

    const fetchPost = async (did?: string) => {
        try {
            const res = await fetch(`/api/confession/${params.id}?device_id=${did || deviceId}`);
            if (res.status === 404) {
                setError(true);
                return;
            }
            const data = await res.json();
            setPost(data);

            // Deep-linking: save college_id for guest redirection
            if (data.college_id) {
                localStorage.setItem('suggested_college_id', data.college_id);
            }
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (id: string, val: number) => {
        if (!post) return;

        // Optimistic
        const currentVote = post.myVote || 0;
        let newVote = currentVote === val ? 0 : val;
        let voteDiff = newVote - currentVote;

        setPost({ ...post, upvotes: post.upvotes + voteDiff, myVote: newVote });

        // API
        try {
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confession_id: id, value: val, device_id: deviceId })
            });
        } catch (e) {
            console.error('Vote failed', e);
        }
    };

    if (error) return <div className="text-center text-white pt-20">Confession not found.</div>;

    return (
        <div className="h-full w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-8 relative z-10 sm:px-6 lg:px-8">
            <AmbientBackground />
            <Navbar onCompose={() => setIsComposeOpen(true)} />

            {/* Main Content */}
            <main className="flex-1 lg:col-span-6 w-full max-w-[480px] lg:max-w-none mx-auto flex flex-col h-full bg-dark-950/50 lg:bg-transparent lg:border-x lg:border-white/5 relative shadow-2xl lg:shadow-none min-h-screen">
                {/* Header */}
                <div className="p-6 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition text-gray-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-xl font-bold uppercase tracking-widest">Confession</h2>
                </div>

                <div className="px-4 lg:px-6 mt-4">
                    {loading ? (
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-white/10 rounded"></div>
                                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    ) : post ? (
                        <>
                            <ConfessionCard post={post} onVote={handleVote} />
                            <CommentSection
                                confessionId={post.id}
                                comments={(post as any).comments || []}
                                deviceId={deviceId}
                                onCommentAdded={() => fetchPost(deviceId)}
                            />
                        </>
                    ) : null}
                </div>
            </main>

            {/* Deep Link / Join CTA for Guests */}
            {post && !loading && (
                <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-brand-glow text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(139,92,246,0.5)] flex items-center justify-between border border-white/20 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">💧</div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-80">Join The Drop</p>
                                <p className="text-sm font-bold">See what's trending now</p>
                            </div>
                        </div>
                        <Link
                            href="/join"
                            className="bg-white text-black px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-gray-100 transition active:scale-95"
                        >
                            Open App
                        </Link>
                    </motion.div>
                </div>
            )}

            <Widgets />
            <MobileDock onCompose={() => setIsComposeOpen(true)} />
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSubmit={async (content, tag, image, options: any) => {
                    const res = await fetch('/api/confess', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content,
                            device_id: deviceId,
                            image,
                            is_shadow: options?.is_shadow,
                            is_open: options?.is_open
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setIsComposeOpen(false);
                        showToast('Dropped!', 'success');
                        // Redirect to home to see the new post in feed
                        window.location.href = '/';
                        return { success: true, safety_warning: data.safety_warning };
                    } else {
                        showToast(data.error, 'error');
                        return { success: false, safety_warning: data.safety_warning };
                    }
                }}
                deviceId={deviceId}
            />
        </div>
    );
}
