import { motion } from 'framer-motion';
import { useMemo } from 'react';
import VideoTile from './VideoTile';

export default function ParticipantGrid({ localStream, localVideoRef, participants, user, activeSpeaker, micOn, cameraOn, localHandRaised, localScreenStream, isLocalScreenSharing }) {
    // Find if someone is sharing screen
    const remotePresenter = participants.find(p => p.isScreenSharing && p.screenStream);
    const presenter = isLocalScreenSharing ? { userId: user._id, userName: user.name, screenStream: localScreenStream, isLocal: true } : remotePresenter;

    const othersCount = participants.length + (isLocalScreenSharing ? 0 : 1); // +1 for local camera if not sharing screen as main? No, usually all cameras stay.

    const gridLayout = useMemo(() => {
        const total = participants.length + 1;
        if (presenter) return 'grid-cols-4'; // Sidebar style
        if (total === 1) return 'grid-cols-1';
        if (total <= 4) return 'grid-cols-2';
        if (total <= 9) return 'grid-cols-3';
        return 'grid-cols-4';
    }, [participants.length, presenter]);

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden">
            {/* Presentation View (if active) */}
            {presenter && (
                <div className="flex-[3] relative bg-dark-600 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                    <VideoTile
                        stream={presenter.screenStream}
                        name={`${presenter.userName}'s Presentation`}
                        isLocal={presenter.isLocal}
                        cameraOn={true}
                        micOn={true} // Not really used for screen usually but anyway
                        isPresentation={true}
                    />
                </div>
            )}

            {/* Participants Grid */}
            <div className={`${presenter ? 'flex-1 overflow-y-auto' : 'flex-[1]'} grid ${presenter ? 'grid-cols-1' : gridLayout} gap-4 h-full`}>
                {/* Local Video */}
                <VideoTile
                    videoRef={localVideoRef}
                    name={user.name + ' (You)'}
                    isLocal={true}
                    micOn={micOn}
                    cameraOn={cameraOn}
                    isActiveSpeaker={activeSpeaker === user._id}
                    stream={localStream}
                    handRaised={localHandRaised}
                />

                {/* Remote Participants */}
                {participants.map((participant) => (
                    <VideoTile
                        key={participant.userId}
                        name={participant.userName}
                        isLocal={false}
                        micOn={participant.micOn}
                        cameraOn={participant.cameraOn}
                        isActiveSpeaker={activeSpeaker === participant.userId}
                        stream={participant.stream}
                        handRaised={participant.handRaised}
                    />
                ))}
            </div>
        </div>
    );
}
