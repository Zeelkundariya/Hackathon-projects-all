import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hand, Mic, MicOff, Video as VideoIcon, VideoOff, User } from 'lucide-react';

export default function VideoTile({ videoRef, name, isLocal, micOn, cameraOn, isActiveSpeaker, stream, handRaised, isPresentation }) {
    const internalVideoRef = useRef(null);
    const actualVideoRef = videoRef || internalVideoRef;

    useEffect(() => {
        let timeout;
        const attachStream = async () => {
            if (actualVideoRef.current && stream) {
                if (actualVideoRef.current.srcObject !== stream) {
                    console.log(`🎥 [VideoTile] Attaching stream to: ${name} (isLocal: ${isLocal})`);
                    actualVideoRef.current.srcObject = stream;

                    try {
                        // Explicitly call play() to ensure video starts
                        // This handles browsers that might block autoPlay
                        await actualVideoRef.current.play();
                    } catch (err) {
                        console.warn(`⚠️ [VideoTile] Playback failed for ${name}:`, err.message);
                        // If it's a "NotAllowedError", we might need user interaction, 
                        // but usually for muted video it works.
                    }
                }
            } else if (stream && !actualVideoRef.current) {
                timeout = setTimeout(attachStream, 100);
            }
        };

        attachStream();
        return () => clearTimeout(timeout);
    }, [stream, actualVideoRef, cameraOn, name]);

    return (
        <motion.div
            layout
            className={`relative bg-dark-400 rounded-lg overflow-hidden ${isActiveSpeaker ? 'active-speaker' : 'border-2 border-transparent'
                }`}
        >
            {/* Video */}
            <div className={`w-full h-full ${cameraOn ? 'block' : 'hidden'}`}>
                <video
                    ref={actualVideoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`w-full h-full ${isPresentation ? 'object-contain bg-black' : 'object-cover'}`}
                />
            </div>

            {!cameraOn && (
                <div className="w-full h-full flex items-center justify-center bg-dark-300">
                    <div className="p-6 bg-primary-500 rounded-full">
                        <User className="w-12 h-12 text-white" />
                    </div>
                </div>
            )}

            {/* Name Label */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 glass rounded-lg flex items-center space-x-2">
                <span className="text-white text-sm font-medium truncate max-w-[150px]">
                    {name}
                </span>
            </div>

            {/* Status Icons */}
            <div className="absolute top-3 right-3 flex items-center space-x-2">
                {handRaised && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-2 bg-yellow-500 rounded-lg shadow-lg"
                    >
                        <Hand className="w-4 h-4 text-white" />
                    </motion.div>
                )}
                <div className="p-2 bg-black/50 rounded-lg">
                    {micOn ? (
                        <Mic className="w-4 h-4 text-white" />
                    ) : (
                        <MicOff className="w-4 h-4 text-red-500" />
                    )}
                </div>
            </div>

            {/* Active Speaker Indicator */}
            {isActiveSpeaker && (
                <div className="absolute top-3 left-3">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-3 h-3 bg-green-500 rounded-full"
                    />
                </div>
            )}
        </motion.div>
    );
}
