import { Home, Compass, Bell, User, Plus, MessageSquare, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import DropCoinIcon from './DropCoinIcon';

export default function Navbar({ onCompose, onFeedback }: { onCompose: () => void; onFeedback?: () => void }) {
    const pathname = usePathname();
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userCoins, setUserCoins] = useState<number>(0);

    useEffect(() => {
        const did = localStorage.getItem('device_id');
        if (did) {
            fetch(`/api/user/profile?device_id=${did}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user?.avatar) setUserAvatar(data.user.avatar);
                    if (data.stats?.coins) setUserCoins(data.stats.coins);
                })
                .catch(e => console.error(e));
        }
    }, []);


    const navItems = [
        { icon: Home, label: 'Confession', href: '/', active: pathname === '/' },
        { icon: Zap, label: 'Open Drops', href: '/open', active: pathname === '/open' },
        { icon: Bell, label: 'Activity', href: '/notifications', active: pathname === '/notifications' },
        { icon: User, label: 'Profile', href: '/my-logic', active: pathname === '/my-logic' },
    ];

    return (
        <aside className="hidden lg:flex lg:col-span-3 flex-col w-full h-screen sticky top-0 border-r border-white/5 bg-dark-950/30 backdrop-blur-xl z-50 pt-8 pb-6 justify-between">
            {/* Logo Area */}
            <div className="px-6 mb-8 flex items-center justify-between">
                <Link href="/my-logic" className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center shadow-lg group-hover:shadow-brand-glow/20 transition-all duration-300 overflow-hidden">
                        <span className="text-white font-bold text-lg">D</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-brand-glow transition-colors">The Drop</h1>
                </Link>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-glow/10 border border-brand-glow/20 shadow-sm">
                        <span className="text-xs font-black text-brand-glow">{(userCoins / 1000).toFixed(1)}K</span>
                        <DropCoinIcon size="sm" />
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1 px-4">
                <p className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
                {navItems.map((item) => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={item.active}
                    />
                ))}
            </nav>

            {/* Feedback Button */}
            {onFeedback && (
                <div className="px-4 mt-4">
                    <button
                        onClick={onFeedback}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                        <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span>Feedback</span>
                    </button>
                </div>
            )}

            {/* CTA - Mac Style Primary Button */}
            <div className="p-6 mt-auto">
                <button
                    onClick={onCompose}
                    className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center gap-2 group transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                >
                    <div className="p-1 rounded-full bg-brand-glow/20 group-hover:bg-brand-glow/40 transition-colors">
                        <Plus className="w-5 h-5 text-brand-glow" />
                    </div>
                    <span className="font-semibold text-white">Drop it 👀</span>
                </button>
            </div>
        </aside>
    );
}

function NavItem({ icon: Icon, label, active, href }: { icon: any, label: string, active?: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                active
                    ? "text-white bg-white/10 font-semibold shadow-inner"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
        >
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-glow shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
            )}
            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-brand-glow" : "group-hover:text-white")} />
            <span>{label}</span>
        </Link>
    );
}
