'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, ShieldAlert, Ban, CheckCircle, Trash2, RefreshCw, Eye, EyeOff, Lock, ArrowRightLeft } from 'lucide-react';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [colleges, setColleges] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Security & UI
    const [showFullIds, setShowFullIds] = useState(false);
    const [adminKey, setAdminKey] = useState<string | null>(null);
    const [tempKey, setTempKey] = useState('');
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        // Hydrate from localStorage
        const stored = localStorage.getItem('drop_admin_secret');
        if (stored) setAdminKey(stored);
    }, []);

    useEffect(() => {
        if (!adminKey) return;

        setLoading(true);
        // Parallel fetching of all admin data with Auth Header
        Promise.all([
            fetch('/api/admin/data', { headers: { 'x-admin-secret': adminKey } }).then(res => res.json()),
            fetch('/api/feedback/admin', { headers: { 'x-admin-secret': adminKey } }).then(res => res.json())
        ])
            .then(([adminData, feedbackData]) => {
                if (adminData.error === 'Unauthorized') {
                    setAuthError(true);
                    setAdminKey(null);
                    localStorage.removeItem('drop_admin_secret');
                    return;
                }
                if (adminData.users) setUsers(adminData.users);
                if (adminData.posts) setPosts(adminData.posts);
                if (adminData.colleges) setColleges(adminData.colleges);
                if (feedbackData.feedback) setFeedback(feedbackData.feedback);
                setAuthError(false);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [refreshTrigger, adminKey]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('drop_admin_secret', tempKey);
        setAdminKey(tempKey);
        setTempKey('');
    };

    const handleModerate = async (action: string, targetId: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const body: any = { action, target_id: targetId };
            if (action === 'MOVE_USER') {
                const newId = prompt('Enter New College ID (e.g., dsu, dsce):');
                if (!newId) return;
                body.new_college_id = newId;
            }

            const res = await fetch('/api/admin/moderate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': adminKey || ''
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                alert('Action failed. Check key.');
            }
        } catch (e) {
            console.error(e);
            alert('Error performing action');
        }
    };

    const maskId = (id: string) => showFullIds ? id : `${id.slice(0, 4)}...${id.slice(-4)}`;

    if (!adminKey) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6 text-center">
                    <div className="w-20 h-20 bg-brand-glow/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand-glow/20">
                        <Lock className="w-10 h-10 text-brand-glow" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Console Access</h1>
                    <p className="text-gray-500 text-sm">Enter the secret key to view the control panel.</p>
                    <input
                        type="password"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-center text-xl text-white focus:outline-none focus:border-brand-glow transition-all"
                        autoFocus
                    />
                    {authError && <p className="text-red-500 text-xs">Invalid key. Try again.</p>}
                    <button className="w-full py-4 bg-brand-glow text-white font-bold rounded-xl shadow-lg shadow-brand-glow/20">
                        Authenticate
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-glow leading-none mb-2 text-glow">Admin Console</h1>
                    <p className="text-xs text-gray-500">Authorized Session • v1.2.0</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFullIds(!showFullIds)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showFullIds ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}
                        title={showFullIds ? "Hide IDs" : "Show Full IDs"}
                    >
                        {showFullIds ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showFullIds ? "Mask IDs" : "Reveal IDs"}
                    </button>

                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => { localStorage.removeItem('drop_admin_secret'); setAdminKey(null); }}
                        className="px-4 py-2 bg-red-950/30 text-red-500 border border-red-900/50 rounded-lg text-xs hover:bg-red-500/20 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Total Users</span>
                    <span className="text-2xl font-bold text-white tracking-tighter">{users.length}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Active Drops</span>
                    <span className="text-2xl font-bold text-green-400 tracking-tighter">{posts.filter(p => p.status === 'LIVE').length}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Colleges</span>
                    <span className="text-2xl font-bold text-blue-400 tracking-tighter">{colleges.length}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Feedback</span>
                    <span className="text-2xl font-bold text-purple-400 tracking-tighter">{feedback.length}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Banned</span>
                    <span className="text-2xl font-bold text-red-500 tracking-tighter">{users.filter(u => u.shadow_banned).length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Users Panel */}
                <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold">Users ({users.length})</h2>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                                <tr className="border-b border-white/10 text-gray-500">
                                    <th className="p-3">Handle</th>
                                    <th className="p-3">College</th>
                                    <th className="p-3">Device ID</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.device_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-bold text-white">{u.handle || 'Guest'}</td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-300">{u.college_name || 'Unknown'}</span>
                                                <span className="text-[9px] text-gray-600 uppercase">{u.college_city || ''}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-400 font-mono tracking-tighter" title={u.device_id}>
                                            {maskId(u.device_id)}
                                        </td>
                                        <td className="p-3">
                                            {u.shadow_banned ?
                                                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase text-[9px]">BANNED</span> :
                                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 font-bold uppercase text-[9px]">Active</span>
                                            }
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleModerate('MOVE_USER', u.device_id)}
                                                    className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"
                                                    title="Move College"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </button>
                                                {u.shadow_banned ? (
                                                    <button
                                                        onClick={() => handleModerate('UNBAN_USER', u.device_id)}
                                                        className="p-1.5 hover:bg-green-500/20 text-green-400 rounded-lg transition"
                                                        title="Unban User"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleModerate('BAN_USER', u.device_id)}
                                                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                                                        title="Shadow Ban User"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* College Servers Panel */}
                <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold">College Servers ({colleges.length})</h2>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {colleges.length > 0 ? colleges.map(college => {
                            const collegeUsers = users.filter(u => u.college_id === college.id);
                            return (
                                <div key={college.id} className="border border-white/5 rounded-xl p-4 bg-black/40 hover:bg-white/5 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-white mb-1">{college.name}</h3>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{college.city}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-brand-glow">{college.user_count}</div>
                                                <div className="text-[9px] text-gray-600 uppercase tracking-widest">Members</div>
                                            </div>
                                        </div>
                                    </div>
                                    {collegeUsers.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <div className="flex flex-wrap gap-2">
                                                {collegeUsers.slice(0, 10).map(u => (
                                                    <span key={u.device_id} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400 border border-white/5">
                                                        {u.handle || 'Guest'}
                                                    </span>
                                                ))}
                                                {collegeUsers.length > 10 && (
                                                    <span className="px-2 py-1 bg-brand-glow/10 rounded-lg text-[10px] font-bold text-brand-glow border border-brand-glow/20">
                                                        +{collegeUsers.length - 10} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="text-center text-gray-500 py-20 italic">No colleges found.</div>
                        )}
                    </div>
                </div>

                {/* Feedback Panel */}
                <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <ShieldAlert className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold">Feedback ({feedback.length})</h2>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {feedback.length > 0 ? feedback.map(f => (
                            <div key={f.id} className="border border-white/5 rounded-xl p-4 bg-black/40 hover:bg-white/5 transition-all flex flex-col gap-3">
                                <p className="text-sm text-gray-200 leading-relaxed font-sans">{f.message}</p>
                                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                                    <span className="text-[10px] text-gray-500 font-mono" title={f.device_id}>
                                        SENDER: {maskId(f.device_id)}
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(f.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-gray-500 py-20 italic">No feedback received.</div>
                        )}
                    </div>
                </div>

                {/* Recent Drops Panel */}
                <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-sm xl:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-orange-400" />
                        <h2 className="text-xl font-bold">Recent Confessions</h2>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                                <tr className="border-b border-white/10 text-gray-500">
                                    <th className="p-3">Message</th>
                                    <th className="p-3 w-32">Status</th>
                                    <th className="p-3 w-40">Created At</th>
                                    <th className="p-3 w-20 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-gray-300 max-w-lg font-sans" title={p.content}>
                                            <p className="line-clamp-2">{p.content}</p>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border
                                                ${p.status === 'LIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    p.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500 text-[10px]">
                                            {new Date(p.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {p.status === 'LIVE' && (
                                                    <button
                                                        onClick={() => handleModerate('DELETE_POST', p.id)}
                                                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                                                        title="Soft Delete"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm('PERMANENTLY DELETE? This cannot be undone.')) {
                                                            handleModerate('HARD_DELETE_POST', p.id);
                                                        }
                                                    }}
                                                    className="p-1.5 hover:bg-red-800/50 text-red-600 rounded-lg transition"
                                                    title="Wipe from DB"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
