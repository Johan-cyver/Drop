'use client';

import { motion, AnimatePresence } from 'framer-motion';
import DropCoinIcon from './DropCoinIcon';
import { useState, useEffect } from 'react';

interface Coin {
    id: number;
    initialX: number;
    initialY: number;
    delay: number;
}

export default function CoinBurst({ trigger }: { trigger: boolean }) {
    const [coins, setCoins] = useState<Coin[]>([]);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (trigger) {
            setActive(true);
            const newCoins = Array.from({ length: 12 }).map((_, i) => ({
                id: Date.now() + i,
                initialX: Math.random() * 400 - 200, // Random spread from center
                initialY: Math.random() * 400 - 200,
                delay: i * 0.05
            }));
            setCoins(newCoins);

            const timer = setTimeout(() => {
                setActive(false);
                setCoins([]);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center">
            <AnimatePresence>
                {active && coins.map((coin) => (
                    <motion.div
                        key={coin.id}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.5, 1, 0.5],
                            x: [0, coin.initialX, -window.innerWidth / 2 + 100], // Fly towards top-right (Navbar balance)
                            y: [0, coin.initialY, -window.innerHeight / 2 + 50],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 1.2,
                            delay: coin.delay,
                            ease: "circOut"
                        }}
                        className="absolute"
                    >
                        <DropCoinIcon size="md" className="shadow-2xl shadow-brand-glow/50" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
