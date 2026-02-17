import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Check, XCircle } from 'lucide-react';

export default function LobbyNotification({ user, onAdmit, onReject, onClose }) {
    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-dark-400 border border-dark-300 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
        >
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <UserPlus className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
                                {user.userName}
                            </p>
                            <p className="text-xs text-gray-400">wants to join</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="mt-4 flex space-x-2">
                    <button
                        onClick={() => {
                            onAdmit(user);
                            onClose();
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Check className="w-3 h-3" />
                        <span>Admit</span>
                    </button>
                    <button
                        onClick={() => {
                            onReject(user);
                            onClose();
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 py-2 bg-dark-300 hover:bg-red-500/20 hover:text-red-400 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                        <XCircle className="w-3 h-3" />
                        <span>Deny</span>
                    </button>
                </div>
            </div>
            <div className="h-1 bg-green-500/30 w-full overflow-hidden">
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="h-full bg-green-500"
                />
            </div>
        </motion.div>
    );
}
