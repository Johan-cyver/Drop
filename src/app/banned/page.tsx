'use client';
import { ShieldAlert } from 'lucide-react';

export default function BannedPage() {
    return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8 text-center text-white space-y-6">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-red-500">Access Restricted</h1>

            <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                Your device has been flagged for violating our community guidelines.
                <br /><br />
                The Drop is a safe space for anonymous expression. Harmful behavior is not tolerated.
            </p>

            <div className="text-xs font-mono text-gray-600 mt-12">
                ERR_DEVICE_BANNED
            </div>
        </div>
    );
}
