'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, Upload, RefreshCw, GraduationCap, Search, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import AmbientBackground from '@/components/AmbientBackground';

// Preset Avatars
const AVATARS = ['👻', '👽', '💀', '🤖', '👾', '🦊', '🌚', '🧛', '🧙', '🥷'];

export default function JoinPage() {
    const router = useRouter();

    // Form State
    const [mode, setMode] = useState<'join' | 'login'>('join');
    const [displayName, setDisplayName] = useState('');
    const [loginHandle, setLoginHandle] = useState('');
    const [dropId, setDropId] = useState('');
    const [pin, setPin] = useState('');
    const [collegeId, setCollegeId] = useState('');
    const [colleges, setColleges] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fetchingColleges, setFetchingColleges] = useState(false);

    const [avatarMode, setAvatarMode] = useState<'preset' | 'upload'>('preset');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [showCollegeModal, setShowCollegeModal] = useState(false);

    // Suggest College Form
    const [suggesting, setSuggesting] = useState(false);
    const [newCollegeName, setNewCollegeName] = useState('');
    const [newCollegeCity, setNewCollegeCity] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async (q: string = '') => {
        setFetchingColleges(true);
        try {
            const res = await fetch(`/api/colleges?q=${q}`);
            const data = await res.json();
            if (data.colleges) {
                setColleges(data.colleges);
                if (data.colleges.length > 0 && !collegeId) {
                    setCollegeId(data.colleges[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch colleges', e);
        } finally {
            setFetchingColleges(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchColleges(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const storedId = localStorage.getItem('device_id');
        const suggestedClg = localStorage.getItem('suggested_college_id');

        if (suggestedClg) {
            setCollegeId(suggestedClg);
        }

        if (storedId) {
            setDeviceId(storedId);
            checkAuth(storedId);
        } else {
            const newId = crypto.randomUUID();
            localStorage.setItem('device_id', newId);
            setDeviceId(newId);
        }
    }, [router]);

    const checkAuth = async (did: string) => {
        try {
            const res = await fetch(`/api/user/check?device_id=${did}`);
            const data = await res.json();
            if (data.hasHandle) {
                router.push('/');
            }
        } catch (e) {
            console.error('Auth check failed', e);
        }
    };

    // Generate DropID when Name changes
    useEffect(() => {
        if (!displayName) {
            setDropId('');
            return;
        }
        const slug = displayName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
        if (slug) {
            const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
            setDropId(`@${slug}_${randomSuffix}`);
        }
    }, [displayName]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("File too large (max 5MB)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 150;
                canvas.width = size;
                canvas.height = size;
                if (ctx) {
                    ctx.drawImage(img, 0, 0, size, size);
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    setUploadedImage(base64);
                    setSelectedAvatar(base64);
                    setAvatarMode('upload');
                    setError('');
                }
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const downloadCredentials = (handle: string, pin: string) => {
        const text = `THE DROP - ACCOUNT RECOVERY KEYS\n\nHandle: ${handle}\nPIN: ${pin}\n\nKeep this safe. You need BOTH to recover your account if you lose this device.\n\nGenerated: ${new Date().toLocaleString()}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TheDrop-Keys-${handle.replace('@', '')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Get/Create Device ID
            let did = localStorage.getItem('device_id');
            if (!did) {
                did = crypto.randomUUID();
                localStorage.setItem('device_id', did);
            }

            // 2. Submit
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: did,
                    name: displayName,
                    college_id: collegeId, // New College
                    pin: pin, // Send PIN to be hashed
                    // Handle is auto-generated in backend if not provided? 
                    // Wait, frontend calculates dropID currently? 
                    // Let's check the code: `const finalDropId = ...`
                    // Ah, the user sees a preview. We should send the PREVIEWED handle.
                    handle: dropId.replace('@', ''),
                    avatar: selectedAvatar // Include selected Avatar
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to join');
            }

            // 3. Success - Download & Redirect
            // Auto download for security
            if (pin) {
                downloadCredentials(dropId, pin);
            }

            // Brief delay to allow download start
            setTimeout(() => {
                router.push('/');
            }, 1000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginHandle || !pin) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle: loginHandle, pin })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Restore Identity!
                localStorage.setItem('device_id', data.device_id);
                // Force reload/redirect
                window.location.href = '/';
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestCollege = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollegeName || !deviceId) return;
        setSuggesting(true);
        try {
            const res = await fetch('/api/colleges/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCollegeName,
                    city: newCollegeCity,
                    device_id: deviceId
                })
            });
            const data = await res.json();
            if (res.ok) {
                setCollegeId(data.college_id);
                setShowCollegeModal(false);
                fetchColleges(); // Refresh list
                alert('College suggested and joined!');
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError('Failed to suggest college');
        } finally {
            setSuggesting(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-6 bg-dark-950 text-white font-sans">
            <AmbientBackground />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        {mode === 'join' ? 'Claim Identity' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {mode === 'join' ? 'One device. One DropID. Forever.' : 'Recover your anonymous identity.'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
                    <button
                        onClick={() => { setMode('join'); setError(''); }}
                        className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", mode === 'join' ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-white")}
                    >
                        New Identity
                    </button>
                    <button
                        onClick={() => { setMode('login'); setError(''); }}
                        className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", mode === 'login' ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-white")}
                    >
                        Login
                    </button>
                </div>

                {/* Card */}
                <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-dark-900/80">

                    {mode === 'join' ? (
                        <form onSubmit={handleJoin} className="space-y-8">
                            {/* Avatar Selection */}
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                                        {selectedAvatar.startsWith('data:') ? (
                                            <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-5xl">{selectedAvatar}</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-brand-glow text-white p-2 rounded-full hover:scale-110 transition shadow-lg"
                                    >
                                        <Upload className="w-4 h-4" />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                </div>

                                {/* Preset Toggles */}
                                <div className="flex gap-2 justify-center flex-wrap">
                                    {AVATARS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => { setSelectedAvatar(emoji); setAvatarMode('preset'); }}
                                            className={cn("w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all", selectedAvatar === emoji ? "bg-brand-glow text-white scale-110 ring-1 ring-white/50" : "bg-white/5 hover:bg-white/10 text-gray-400 grayscale")}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Display Name Input */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="e.g. Alex Doe"
                                        maxLength={30}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-glow/50 transition-all font-medium"
                                    />
                                </div>

                                {/* DropID Read-only */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-brand-glow ml-1 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Your DropID (Uneditable)
                                    </label>
                                    <input
                                        type="text"
                                        value={dropId}
                                        readOnly
                                        disabled
                                        className="w-full bg-brand-glow/5 border border-brand-glow/20 rounded-xl py-3 px-4 text-brand-glow font-mono font-bold tracking-wide opacity-80 cursor-not-allowed"
                                    />
                                </div>

                                {/* College Selection */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Select College</label>

                                    {/* Search / Filter */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search colleges..."
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-glow/30"
                                        />
                                    </div>

                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {fetchingColleges && (
                                            <div className="text-center py-4 text-gray-600 text-[10px] animate-pulse uppercase font-black">Finding Colleges...</div>
                                        )}
                                        {!fetchingColleges && colleges.length === 0 && (
                                            <div className="text-center py-4 text-gray-600 text-xs italic">No colleges found</div>
                                        )}
                                        {colleges.map((college) => (
                                            <button
                                                key={college.id}
                                                type="button"
                                                onClick={() => setCollegeId(college.id)}
                                                className={cn(
                                                    "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between",
                                                    collegeId === college.id
                                                        ? "bg-brand-glow/10 border-brand-glow/30 text-white"
                                                        : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{college.name}</span>
                                                    <span className="text-[10px] uppercase tracking-tighter opacity-60">{college.city}</span>
                                                </div>
                                                {college.status === 'PENDING' && (
                                                    <span className="text-[8px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Community</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowCollegeModal(true)}
                                        className="w-full p-3 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-brand-glow hover:border-brand-glow/30 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Suggest New College
                                    </button>
                                </div>

                                {/* PIN Input */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                        Recovery PIN (Required)
                                    </label>
                                    <input
                                        type="password"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="4-6 digit secret code"
                                        maxLength={6}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-glow/50 transition-all font-mono tracking-widest text-center text-lg"
                                    />
                                    <p className="text-[10px] text-gray-500 px-1">You'll need this to login on other devices.</p>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !displayName || !dropId || pin.length < 4}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-start to-brand-end font-bold text-lg text-white shadow-lg lg:hover:shadow-brand-glow/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Minting Identity...' : 'Confirm Identity'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">DropID</label>
                                    <input
                                        type="text"
                                        value={loginHandle}
                                        onChange={(e) => setLoginHandle(e.target.value)}
                                        placeholder="@username_1234"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-glow/50 transition-all font-medium"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Recovery PIN</label>
                                    <input
                                        type="password"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="••••"
                                        maxLength={6}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-glow/50 transition-all font-mono tracking-widest text-center text-lg"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !loginHandle || !pin}
                                className="w-full py-4 rounded-2xl bg-white text-dark-950 font-bold text-lg shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Restoring...' : 'Restore Identity'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Suggest College Modal */}
                <div className={cn(
                    "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl transition-all duration-300",
                    showCollegeModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}>
                    <div className="w-full max-w-sm bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                        <button
                            onClick={() => setShowCollegeModal(false)}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-brand-glow/10 flex items-center justify-center mx-auto mb-4 border border-brand-glow/20">
                                <GraduationCap className="w-8 h-8 text-brand-glow" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Suggest College</h3>
                            <p className="text-xs text-gray-500 mt-2">Help us expand the community.</p>
                        </div>

                        <form onSubmit={handleSuggestCollege} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">College Name</label>
                                <input
                                    type="text"
                                    value={newCollegeName}
                                    onChange={(e) => setNewCollegeName(e.target.value)}
                                    placeholder="e.g. Stanford University"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">City</label>
                                <input
                                    type="text"
                                    value={newCollegeCity}
                                    onChange={(e) => setNewCollegeCity(e.target.value)}
                                    placeholder="e.g. California"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={suggesting}
                                className="w-full py-4 rounded-xl bg-brand-glow text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-glow/20 mt-4 disabled:opacity-50"
                            >
                                {suggesting ? 'Submitting...' : 'Suggest & Join'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 92, 246, 0.4);
                }
            `}</style>
        </div >
    );
}
