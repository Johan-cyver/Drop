'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AmbientBackground from '@/components/AmbientBackground';
import Navbar from '@/components/Navbar';
import Widgets from '@/components/Widgets';
import Feed from '@/components/Feed';
import MobileDock from '@/components/MobileDock';
import ComposeModal from '@/components/ComposeModal';
import FeedbackModal from '@/components/FeedbackModal';
import { Post } from '@/components/ConfessionCard';
import { showToast } from '@/components/NotificationToast';
import GuideModal from '@/components/GuideModal';

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [hotCount, setHotCount] = useState(0);
    const [userCollegeId, setUserCollegeId] = useState<string | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [globalMegaDrop, setGlobalMegaDrop] = useState<Post | null>(null);

    const router = useRouter();

    // Initialize & Fetch
    useEffect(() => {
        // Device ID Management
        let did = localStorage.getItem('device_id');
        if (!did) {
            did = crypto.randomUUID();
            localStorage.setItem('device_id', did);
        }
        setDeviceId(did);

        // Auth Check & Initial Fetch
        checkAuth(did).then(user => {
            if (user && user.college_id) {
                setUserCollegeId(user.college_id);
                fetchFeed(did, user.college_id);

                // Auto Onboarding Check
                const hasSeenGuide = localStorage.getItem('has_seen_guide');
                if (!hasSeenGuide) {
                    setTimeout(() => setIsGuideOpen(true), 2000); // 2s delay for premium feel
                    localStorage.setItem('has_seen_guide', 'true');
                }
            } else {
                router.push('/join');
            }
        });

        // Real-time Polling (Every 30 seconds to stay within Vercel Postgres free limits)
        const interval = setInterval(() => {
            if (did) {
                // Check Ban Status + Fetch Feed
                checkAuth(did).then(good => {
                    if (good) fetchFeed(did, userCollegeId || undefined);
                    else router.push('/join');
                });
            }
        }, 30000);

        // Fetch on focus
        const handleFocus = () => {
            if (did) fetchFeed(did, userCollegeId || undefined);
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // College fetch removed for marketing restriction

    const checkAuth = async (did: string) => {
        try {
            const res = await fetch(`/api/user/check?device_id=${did}`);
            const data = await res.json();

            if (data.blocked) {
                router.push('/banned');
                return null;
            }

            if (data.hasHandle) {
                // Cache identity for Tea Lounge
                localStorage.setItem('user_handle', data.handle || '');
                if (data.avatar) localStorage.setItem('user_avatar', data.avatar);
                return { college_id: data.college_id };
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const fetchFeed = async (did?: string, collegeId?: string) => {
        try {
            const url = `/api/feed?device_id=${did || deviceId}${collegeId ? `&college_id=${collegeId}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.feed) {
                setPosts(data.feed);
                setHotCount(data.meta?.hotCount || 0);
                setGlobalMegaDrop(data.globalMegaDrop || null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // College switching removed

    const handleVote = async (id: string, val: number) => {
        // 1. Optimistic UI Update
        const updated = posts.map(p => {
            if (p.id !== id) return p;

            // Toggle Logic
            const currentVote = p.myVote || 0;
            let newVote = currentVote === val ? 0 : val;
            let voteDiff = newVote - currentVote;

            return { ...p, upvotes: p.upvotes + voteDiff, myVote: newVote };
        });
        setPosts(updated);

        // 2. API Call (Fire & Forget mostly, but we catch errors)
        try {
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confession_id: id, value: val, device_id: deviceId })
            });
        } catch (e) {
            console.error('Vote failed', e);
            // Revert on error in a production app
        }
    };

    const handleSubmit = async (content: string, tag: string, image?: string, options?: { is_shadow?: boolean, is_open?: boolean, unlock_threshold?: number, tease_mode?: string }) => {
        try {
            const res = await fetch('/api/confess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    device_id: deviceId,
                    image,
                    is_shadow: options?.is_shadow,
                    is_open: options?.is_open,
                    unlock_threshold: options?.unlock_threshold,
                    tease_mode: options?.tease_mode
                })
            });

            const data = await res.json();

            if (res.ok) {
                fetchFeed(deviceId);
                setIsComposeOpen(false);
                showToast('Confession dropped successfully!', 'success');
                return { success: true, safety_warning: data.safety_warning };
            } else {
                showToast(data.error || 'Failed to post', 'error');
                return { success: false, safety_warning: data.safety_warning, error: data.error };
            }
        } catch (e) {
            showToast('Network error', 'error');
            return { success: false };
        }
    };

    return (
        <div className="h-full w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-8 relative z-10 sm:px-6 lg:px-8">
            <AmbientBackground />

            <Navbar
                onCompose={() => setIsComposeOpen(true)}
                onFeedback={() => setIsFeedbackOpen(true)}
            />

            <Feed
                posts={posts}
                onVote={handleVote}
                userCollegeId={userCollegeId}
                globalMegaDrop={globalMegaDrop}
            />

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

            <GuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
            />
        </div>
    );
}
