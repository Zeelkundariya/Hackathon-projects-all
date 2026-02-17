import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

export default function ChatNotification({ message, onClose }) {
    if (!message) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed bottom-24 right-6 z-50 w-72 bg-dark-400 border border-dark-300 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
        >
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
                                {message.sender.name}
                            </p>
                            <p className="text-xs text-gray-400">New message</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
                <div className="mt-3">
                    <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed">
                        {message.message}
                    </p>
                </div>
            </div>
            <div className="h-1 bg-primary-500/30 w-full overflow-hidden">
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-primary-500"
                />
            </div>
        </motion.div>
    );
}
