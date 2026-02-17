import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, Crown, Check, UserX, Users } from 'lucide-react';

export default function ParticipantsSidebar({
    participants,
    waitingUsers = [],
    onAdmit,
    onReject,
    onClose,
    isCurrentUserHost,
    currentUserId,
    onMute,
    onDisableCamera,
    onRemove
}) {
    return (
        <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            className="w-80 bg-dark-400 border-l border-gray-700 flex flex-col h-full shadow-2xl z-40"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                    Participants ({participants.length})
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Waiting List Section */}
                {waitingUsers.length > 0 && isCurrentUserHost && (
                    <div className="p-4 border-b border-gray-700 bg-primary-500/5">
                        <div className="flex items-center space-x-2 mb-3">
                            <Users className="w-4 h-4 text-primary-500" />
                            <h4 className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
                                Waiting to join ({waitingUsers.length})
                            </h4>
                        </div>
                        <div className="space-y-2">
                            <AnimatePresence>
                                {waitingUsers.map((user) => (
                                    <motion.div
                                        key={user.socketId}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-dark-300 p-3 rounded-xl border border-primary-500/20"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                    {user.userName?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-white truncate max-w-[120px]">
                                                    {user.userName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => onAdmit(user)}
                                                className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1"
                                            >
                                                <Check className="w-3 h-3" />
                                                <span>Admit</span>
                                            </button>
                                            <button
                                                onClick={() => onReject(user)}
                                                className="flex-1 py-1.5 bg-dark-200 hover:bg-red-600/20 text-red-500 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 border border-red-500/20"
                                            >
                                                <UserX className="w-3 h-3" />
                                                <span>Deny</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Participants List */}
                <div className="p-4 space-y-2">
                    {participants.map((participant) => (
                        <div
                            key={participant.userId}
                            className="flex flex-col p-3 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors space-y-3"
                        >
                            <div className="flex items-center space-x-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {participant.userName?.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-white font-medium truncate">{participant.userName}</p>
                                        {participant.isHost && (
                                            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>

                                {/* Status Icons */}
                                <div className="flex space-x-2 flex-shrink-0">
                                    {participant.micOn ? (
                                        <Mic className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <MicOff className="w-4 h-4 text-red-500" />
                                    )}
                                    {participant.cameraOn ? (
                                        <Video className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <VideoOff className="w-4 h-4 text-red-500" />
                                    )}
                                </div>
                            </div>

                            {/* Host Controls */}
                            {isCurrentUserHost && participant.userId !== currentUserId && (
                                <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
                                    <button
                                        onClick={() => onMute(participant.userId)}
                                        className="p-2 bg-dark-200 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-1"
                                        title="Mute participant"
                                    >
                                        <MicOff className="w-4 h-4 mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => onDisableCamera(participant.userId)}
                                        className="p-2 bg-dark-200 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-1"
                                        title="Turn off camera"
                                    >
                                        <VideoOff className="w-4 h-4 mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => onRemove(participant.userId)}
                                        className="p-2 bg-dark-200 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-1"
                                        title="Remove participant"
                                    >
                                        <UserX className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
