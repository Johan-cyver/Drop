import { Home, Search, Plus, Bell, User } from 'lucide-react';

interface MobileDockProps {
    onCompose: () => void;
}

export default function MobileDock({ onCompose }: MobileDockProps) {
    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[400px] px-4">
            <div className="glass-panel rounded-full p-2 flex justify-between items-center shadow-2xl shadow-black/50">
                <button className="w-12 h-12 flex items-center justify-center rounded-full text-brand-glow bg-white/5">
                    <Home className="w-6 h-6" />
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 hover:text-white transition">
                    <Search className="w-6 h-6" />
                </button>

                <button
                    onClick={onCompose}
                    className="bg-white text-black h-12 px-6 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition transform hover:-translate-y-0.5 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    <span>Drop</span>
                </button>

                <button className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 hover:text-white transition">
                    <Bell className="w-6 h-6" />
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 hover:text-white transition">
                    <User className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
