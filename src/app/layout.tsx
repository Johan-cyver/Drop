import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'The Drop 💧',
    description: 'Anonymous confessions for your college.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${outfit.className} bg-dark-950 text-white min-h-screen overflow-x-hidden selection:bg-brand-glow/30`}>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
