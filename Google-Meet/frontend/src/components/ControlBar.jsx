import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Share,
    MessageSquare,
    Users,
    Phone,
    MoreVertical,
    Smile,
    Hand
} from 'lucide-react';

export default function ControlBar({
    micOn,
    cameraOn,
    onToggleMic,
    onToggleCamera,
    onToggleChat,
    onToggleParticipants,
    onLeaveMeeting,
    participantCount,
    meetingId,
    waitingCount = 0,
    onOpenAdmitPanel,
    onToggleHand,
    handRaised,
    onToggleScreenShare,
    screenSharing
}) {
    const [showMore, setShowMore] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const copyMeetingLink = () => {
        const link = `${window.location.origin}/meeting/${meetingId}`;
        navigator.clipboard.writeText(link);
        alert('Meeting link copied!');
    };

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-dark-300/80 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 shrink-0">
                    {/* Media Controls */}
                    <div className="flex items-center space-x-2 px-2 border-r border-white/10 mr-2">
                        <button
                            onClick={onToggleMic}
                            className={`p-3 rounded-xl transition-all duration-200 ${micOn
                                ? 'bg-white/5 hover:bg-white/10 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                }`}
                            title={micOn ? 'Mute' : 'Unmute'}
                        >
                            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onToggleCamera}
                            className={`p-3 rounded-xl transition-all duration-200 ${cameraOn
                                ? 'bg-white/5 hover:bg-white/10 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                }`}
                            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Features */}
                    <div className="flex items-center space-x-2 px-2 border-r border-white/10 mr-2">
                        <button
                            onClick={onToggleScreenShare}
                            className={`p-3 rounded-xl transition-all duration-200 ${screenSharing
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'bg-white/5 hover:bg-white/10 text-white'
                                }`}
                            title={screenSharing ? 'Stop presenting' : 'Present now'}
                        >
                            <Share className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onToggleHand}
                            className={`p-3 rounded-xl transition-all duration-200 ${handRaised
                                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
                                    : 'bg-white/5 hover:bg-white/10 text-white'
                                }`}
                            title={handRaised ? 'Lower hand' : 'Raise hand'}
                        >
                            <Hand className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Interaction */}
                    <div className="flex items-center space-x-2 px-2">
                        <button
                            onClick={onToggleChat}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-200 relative"
                            title="Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onToggleParticipants}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-200 relative"
                            title="Participants"
                        >
                            <Users className="w-5 h-5" />
                            {(waitingCount > 0 || participantCount > 1) && (
                                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-dark-300 ${waitingCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-primary-500'}`} />
                            )}
                        </button>
                        <button
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-200"
                            title="More options"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Leave Button */}
                    <div className="pl-4">
                        <button
                            onClick={() => setShowLeaveConfirm(true)}
                            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg shadow-red-500/20"
                            title="Leave call"
                        >
                            <Phone className="w-5 h-5 rotate-[135deg]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Leave Confirmation Modal */}
            <AnimatePresence>
                {showLeaveConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
                        onClick={() => setShowLeaveConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-dark-300 border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
                        >
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Leave call?
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to leave this meeting? Your connection will be closed.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onLeaveMeeting}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20"
                                >
                                    Leave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
