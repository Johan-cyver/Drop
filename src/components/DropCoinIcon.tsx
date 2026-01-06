'use client';
import { cn } from '@/lib/utils';

export default function DropCoinIcon({ className, size = "md" }: { className?: string, size?: "xs" | "sm" | "md" | "lg" }) {
    const sizeClasses = {
        xs: "w-3 h-3 text-[6px]",
        sm: "w-4 h-4 text-[8px]",
        md: "w-5 h-5 text-[10px]",
        lg: "w-8 h-8 text-[14px]"
    };

    return (
        <div className={cn(
            "rounded-full bg-gradient-to-br from-brand-glow to-purple-600 flex items-center justify-center font-black text-white shadow-[0_0_10px_rgba(139,92,246,0.5)] border border-white/20 select-none",
            sizeClasses[size],
            className
        )}>
            DC
        </div>
    );
}
