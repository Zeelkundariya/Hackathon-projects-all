import { motion } from 'framer-motion';
import { Clock, User, Shield } from 'lucide-react';

export default function WaitingRoom({ meetingInfo, hostName }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-12 max-w-md w-full text-center"
            >
                {/* Animated Icon */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="inline-block mb-6"
                >
                    <div className="p-6 bg-primary-500/20 rounded-full">
                        <Shield className="w-16 h-16 text-primary-500" />
                    </div>
                </motion.div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white mb-4">
                    Waiting for Host
                </h2>

                {/* Meeting Info */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-center space-x-2 text-gray-300">
                        <User className="w-5 h-5 text-primary-500" />
                        <p>
                            Host: <span className="font-medium text-white">{hostName || 'Unknown'}</span>
                        </p>
                    </div>

                    {meetingInfo?.title && (
                        <p className="text-gray-400">
                            Meeting: <span className="text-white">{meetingInfo.title}</span>
                        </p>
                    )}
                </div>

                {/* Waiting Message */}
                <div className="bg-dark-300 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <p className="text-yellow-500 font-medium">Please Wait</p>
                    </div>
                    <p className="text-gray-400 text-sm">
                        The meeting host will let you in soon. You'll be automatically admitted once approved.
                    </p>
                </div>

                {/* Animated Dots */}
                <div className="flex items-center justify-center space-x-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-3 h-3 bg-primary-500 rounded-full"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
