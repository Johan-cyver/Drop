'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, ShieldAlert, Ban, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        // Parallel fetching of all admin data
        Promise.all([
            fetch('/api/admin/data').then(res => res.json()),
            fetch('/api/feedback/admin').then(res => res.json())
        ])
            .then(([adminData, feedbackData]) => {
                if (adminData.users) setUsers(adminData.users);
                if (adminData.posts) setPosts(adminData.posts);
                if (feedbackData.feedback) setFeedback(feedbackData.feedback);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            setRefreshTrigger(prev => prev + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const handleModerate = async (action: string, targetId: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const res = await fetch('/api/admin/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, target_id: targetId })
            });

            if (res.ok) {
                // Quick refresh
                setRefreshTrigger(prev => prev + 1);
            } else {
                alert('Action failed');
            }
        } catch (e) {
            console.error(e);
            alert('Error performing action');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-brand-glow">Admin Console</h1>
                <button
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Users Panel */}
                <div className="border border-white/10 rounded-xl p-6 bg-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold">Users ({users.length})</h2>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#111] z-10">
                                <tr className="border-b border-white/10 text-gray-500">
                                    <th className="p-2">Handle</th>
                                    <th className="p-2">Device ID</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.device_id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-2 font-bold text-white">{u.handle || 'Guest'}</td>
                                        <td className="p-2 text-gray-400" title={u.device_id}>{u.device_id.slice(0, 8)}...</td>
                                        <td className="p-2">
                                            {u.shadow_banned ?
                                                <span className="text-red-500 font-bold">BANNED</span> :
                                                <span className="text-green-500">Active</span>
                                            }
                                        </td>
                                        <td className="p-2 text-right">
                                            {u.shadow_banned ? (
                                                <button
                                                    onClick={() => handleModerate('UNBAN_USER', u.device_id)}
                                                    className="p-1 hover:bg-green-500/20 text-green-400 rounded transition"
                                                    title="Unban User"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleModerate('BAN_USER', u.device_id)}
                                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition"
                                                    title="Shadow Ban User"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feedback Panel (New!) */}
                <div className="border border-white/10 rounded-xl p-6 bg-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold">Feedback ({feedback.length})</h2>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {feedback.length > 0 ? feedback.map(f => (
                            <div key={f.id} className="border border-white/5 rounded-lg p-3 bg-black/20 hover:bg-white/5 transition flex flex-col gap-2">
                                <p className="text-sm text-gray-200">{f.message}</p>
                                <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                                    <span className="text-[10px] text-gray-500 font-mono" title={f.device_id}>
                                        ID: {f.device_id.slice(0, 8)}...
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(f.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-gray-500 py-10">No feedback yet.</div>
                        )}
                    </div>
                </div>

                {/* Recent Drops Panel */}
                <div className="border border-white/10 rounded-xl p-6 bg-white/5 xl:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-orange-400" />
                        <h2 className="text-xl font-bold">Recent Drops</h2>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#111] z-10">
                                <tr className="border-b border-white/10 text-gray-500">
                                    <th className="p-2">Content</th>
                                    <th className="p-2 w-24">ID</th>
                                    <th className="p-2 w-24">Status</th>
                                    <th className="p-2 w-20 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-2 text-gray-300 max-w-md truncate" title={p.content}>{p.content}</td>
                                        <td className="p-2 font-mono text-gray-500">{p.public_id || 'N/A'}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold 
                                                ${p.status === 'LIVE' ? 'bg-green-500/10 text-green-400' :
                                                    p.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-2 text-right">
                                            {p.status === 'LIVE' && (
                                                <button
                                                    onClick={() => handleModerate('DELETE_POST', p.id)}
                                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition mr-1"
                                                    title="Reject Post (Soft Delete)"
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
                                                className="p-1 hover:bg-red-800/50 text-red-600 rounded transition"
                                                title="Permanently Delete (Hard Delete)"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
