import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Users, X } from 'lucide-react';

export default function AdmitPanel({ waitingUsers, onAdmit, onReject, onClose }) {
    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-96 glass border-l border-gray-700 z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-white">Waiting to Join</h3>
                    <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                        {waitingUsers.length}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Waiting Users List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {waitingUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No one waiting</p>
                    </div>
                ) : (
                    waitingUsers.map((user) => (
                        <motion.div
                            key={user.socketId}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            className="bg-dark-300 rounded-xl p-4"
                        >
                            {/* User Info */}
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {user.userName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{user.userName}</p>
                                    <p className="text-xs text-gray-400">
                                        Requested {new Date(user.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => onAdmit(user)}
                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Admit</span>
                                </button>
                                <button
                                    onClick={() => onReject(user)}
                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                    <UserX className="w-4 h-4" />
                                    <span>Reject</span>
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
