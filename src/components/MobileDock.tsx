import { Home, Compass, Plus, Bell, User, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileDockProps {
    onCompose: () => void;
    onFeedback: () => void;
}

export default function MobileDock({ onCompose, onFeedback }: MobileDockProps) {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Confession', href: '/', active: pathname === '/' },
        { icon: Zap, label: 'Open', href: '/open', active: pathname === '/open' },
        { icon: Bell, label: 'Activity', href: '/notifications', active: pathname === '/notifications' },
        { icon: User, label: 'Profile', href: '/my-logic', active: pathname === '/my-logic' },
    ];

    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[400px] px-4">
            <div className="glass-panel rounded-full p-2 flex justify-between items-center shadow-2xl shadow-black/50 border border-white/10 backdrop-blur-2xl">
                <div className="flex flex-1 justify-around items-center">
                    {navItems.slice(0, 2).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90",
                                item.active ? "text-brand-glow bg-white/10 shadow-inner" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                        </Link>
                    ))}

                    <button
                        onClick={onCompose}
                        className="bg-brand-glow text-white w-12 h-12 rounded-full font-bold flex items-center justify-center hover:bg-brand-accent transition transform active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.5)] border-2 border-white/20"
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    {navItems.slice(2).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90",
                                item.active ? "text-brand-glow bg-white/10 shadow-inner" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
