'use client';

import { useState, useRef } from 'react';
import { Camera, RefreshCw, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraCaptureProps {
    onCapture: (base64: string) => void;
    onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
            // Stop existing tracks first
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            setError('Camera access denied or not available.');
        }
    };

    const toggleCamera = () => {
        const nextMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextMode);
        if (stream) {
            startCamera(nextMode);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(base64);
                stopCamera();
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-center z-20">
                            <button onClick={onCancel} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md">
                                <X className="w-6 h-6" />
                            </button>
                            <button onClick={toggleCamera} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{facingMode === 'user' ? 'Front' : 'Back'}</span>
                            </button>
                        </div>
                        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                    </>
                ) : (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-black/80 backdrop-blur-xl">
                        <div className="space-y-4">
                            <p className="text-red-400 font-bold">{error}</p>
                            <button onClick={() => startCamera()} className="bg-white/10 text-white px-6 py-2 rounded-full font-bold text-sm">Retry</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-40 bg-black flex items-center justify-around px-8">
                {!capturedImage ? (
                    <>
                        <div className="w-8" /> {/* Spacer */}
                        <button
                            onClick={takePhoto}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"
                        >
                            <div className="w-full h-full rounded-full bg-white active:scale-95 transition-transform" />
                        </button>
                        <div className="w-8" /> {/* Spacer */}
                    </>
                ) : (
                    <>
                        <button onClick={handleRetake} className="flex flex-col items-center gap-2 text-white/60">
                            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest">Retake</span>
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex flex-col items-center gap-2 text-brand-glow"
                        >
                            <div className="w-20 h-20 rounded-full bg-brand-glow flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest">Keep It</span>
                        </button>
                        <button onClick={onCancel} className="flex flex-col items-center gap-2 text-white/60">
                            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                                <X className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest">Cancel</span>
                        </button>
                    </>
                )}
            </div>

            {/* Initial start check */}
            {!stream && !capturedImage && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-brand-glow/20 rounded-[2rem] flex items-center justify-center mx-auto border border-brand-glow/30">
                            <Camera className="w-10 h-10 text-brand-glow" />
                        </div>
                        <button
                            onClick={() => startCamera()}
                            className="bg-brand-glow text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl mx-auto"
                        >
                            Start Camera
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
