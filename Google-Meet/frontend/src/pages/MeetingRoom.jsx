import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import ParticipantGrid from '../components/ParticipantGrid';
import ControlBar from '../components/ControlBar';
import ChatSidebar from '../components/ChatSidebar';
import ParticipantsSidebar from '../components/ParticipantsSidebar';
import MeetingHeader from '../components/MeetingHeader';
import WaitingRoom from '../components/WaitingRoom';
import AdmitPanel from '../components/AdmitPanel';
import ChatNotification from '../components/ChatNotification';
import LobbyNotification from '../components/LobbyNotification';
import { AnimatePresence } from 'framer-motion';
import Peer from 'simple-peer';

export default function MeetingRoom() {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const [meeting, setMeeting] = useState(null);
    const [participants, setParticipants] = useState([]);
    const participantsRef = useRef([]);
    const [localStream, setLocalStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [peers, setPeers] = useState(new Map());
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);
    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newNotification, setNewNotification] = useState(null);
    const [lobbyNotification, setLobbyNotification] = useState(null);
    const [handRaised, setHandRaised] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);

    // Waiting room states
    const [isWaiting, setIsWaiting] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [waitingUsers, setWaitingUsers] = useState([]);
    const [admitPanelOpen, setAdmitPanelOpen] = useState(false);

    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peersRef = useRef(new Map());
    const handRaisedRef = useRef(false);
    const screenSharingRef = useRef(false);

    // Use refs to avoid stale closure in socket listeners
    const isHostRef = useRef(false);
    const meetingRef = useRef(null);
    const iceCandidatesQueueRef = useRef(new Map()); // peerId -> candidates[]
    const chatOpenRef = useRef(false);

    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

    useEffect(() => {
        handRaisedRef.current = handRaised;
    }, [handRaised]);

    useEffect(() => {
        chatOpenRef.current = chatOpen;
        if (chatOpen) setNewNotification(null); // Clear notification if chat is opened
    }, [chatOpen]);

    useEffect(() => {
        initMeeting();
        return () => cleanup();
    }, []);

    const initMeeting = async () => {
        try {
            // Get meeting details
            console.log('Fetching meeting:', meetingId);
            const { data } = await api.get(`/meetings/${meetingId}`);

            if (!data.success) {
                console.error('Meeting not found');
                setError('Meeting not found');
                setLoading(false);
                return;
            }

            console.log('Meeting found:', data.data);
            setMeeting(data.data);
            meetingRef.current = data.data; // Update ref

            // Check if user is host
            // Host can be either ObjectId string or populated object with _id
            const hostId = typeof data.data.host === 'object' ? data.data.host._id : data.data.host;
            const userId = user._id;
            const userIsHost = hostId.toString() === userId.toString();

            console.log('🔍 Host check - Host ID:', hostId, 'User ID:', userId, 'Is Host:', userIsHost);

            setIsHost(userIsHost);
            isHostRef.current = userIsHost; // Update ref

            // Join meeting API
            console.log('Joining meeting...');
            const joinResponse = await api.post(`/meetings/${meetingId}/join`);

            if (!joinResponse.data.success) {
                console.error('Failed to join meeting API');
                setError('Failed to join meeting');
                setLoading(false);
                return;
            }

            console.log('Successfully joined meeting via API');

            // Fetch chat history
            try {
                const messagesResp = await api.get(`/meetings/${meetingId}/messages`);
                if (messagesResp.data.success) {
                    setMessages(messagesResp.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch chat history:', err);
            }

            // Get local media stream
            console.log('Requesting camera and microphone access...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                console.log('Media access granted');
                setLocalStream(stream);
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (mediaError) {
                console.error('Media access error:', mediaError);
                // Continue without media - user can enable later
                alert('Camera/Microphone access denied. You can enable them from the meeting controls.');
                // Create empty stream as fallback
                stream = new MediaStream();
            }

            setLocalStream(stream);

            if (stream && localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Join socket room
            if (socket) {
                if (userIsHost) {
                    // Host joins directly
                    console.log('Host joining room directly');
                    socket.emit('join-room', {
                        meetingId,
                        userId: user._id,
                        userName: user.name,
                        isHost: true
                    });
                    setLoading(false);
                } else {
                    // Non-host requests to join (waiting room)
                    console.log('Non-host requesting to join');
                    socket.emit('request-to-join', {
                        meetingId,
                        userId: user._id,
                        userName: user.name
                    });
                    setIsWaiting(true);
                    setLoading(false);
                }

                setupSocketListeners();
            } else {
                console.error('Socket not connected');
                setError('Connection error. Please refresh the page.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to initialize meeting:', error);

            // Provide specific error message
            let errorMessage = 'Failed to join meeting';
            if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        if (!socket) return;

        // Clear existing listeners to prevent duplication
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('existing-participants');
        socket.off('user-mic-toggle');
        socket.off('user-camera-toggle');
        socket.off('user-speaking');
        socket.off('join-request');
        socket.off('admitted');
        socket.off('rejected');
        socket.off('chat-message');

        socket.on('chat-message', (message) => {
            setMessages(prev => [...prev, message]);

            // Show notification if chat is closed and sender is not self
            if (!chatOpenRef.current && message.sender.userId !== user._id) {
                setNewNotification(message);
                // Clear notification after 5 seconds
                setTimeout(() => {
                    setNewNotification(null);
                }, 5000);
            }
        });

        socket.on('user-joined', ({ userId, userName, peerId }) => {
            if (userId === user._id) return; // Skip self

            console.log('User joined:', userName, 'UserID:', userId);

            // Use peersRef as the source of truth for peer connections to prevent race conditions
            if (peersRef.current.has(peerId)) {
                console.log('⚠️ Already connected to peer:', peerId, 'skipping duplicate creation');
                return;
            }

            // Update UI state
            setParticipants(prev => {
                const exists = prev.find(p => p.peerId === peerId);
                if (exists) return prev;
                return [...prev, { userId, userName, peerId, micOn: true, cameraOn: true }];
            });

            // Initiate side effect outside of state updater
            if (localStreamRef.current) {
                console.log('🚀 Initiating peer connection to joiner:', userName);

                const streams = [localStreamRef.current];
                if (screenSharingRef.current && screenStreamRef.current) {
                    streams.push(screenStreamRef.current);
                }

                createPeer(peerId, userId, userName, streams, true);
            }
        });

        socket.on('user-left', ({ userId, newHost }) => {
            setParticipants(prev => prev.filter(p => p.userId !== userId));

            // If a new host was assigned, update local isHost state
            if (newHost && newHost.userId === user._id) {
                setIsHost(true);
                console.log('You are now the host');
                // Show notification
                alert(`You are now the host of this meeting`);
            }

            // Clean up peer connection
        });

        socket.on('existing-participants', (existingParticipants) => {
            console.log('Found existing participants:', existingParticipants.length);

            // Filter out self
            const others = existingParticipants.filter(p => p.userId !== user._id);

            setParticipants(prev => {
                // Merge to preserve streams we might already have
                return others.map(p => {
                    const existing = prev.find(ep => ep.peerId === p.peerId || ep.userId === p.userId);
                    return {
                        ...p,
                        micOn: p.micOn ?? (existing?.micOn ?? true),
                        cameraOn: p.cameraOn ?? (existing?.cameraOn ?? true),
                        isScreenSharing: p.isScreenSharing ?? (existing?.isScreenSharing ?? false),
                        stream: existing?.stream || null,
                        screenStream: existing?.screenStream || null
                    };
                });
            });
        });

        socket.on('user-mic-toggle', ({ userId, micOn }) => {
            setParticipants(prev =>
                prev.map(p => p.userId === userId ? { ...p, micOn } : p)
            );
        });

        socket.on('user-camera-toggle', ({ userId, cameraOn }) => {
            setParticipants(prev =>
                prev.map(p => p.userId === userId ? { ...p, cameraOn } : p)
            );
        });

        socket.on('hand-raise', ({ userId, raised }) => {
            setParticipants(prev =>
                prev.map(p => p.userId === userId ? { ...p, handRaised: raised } : p)
            );
        });

        socket.on('screen-share-status', ({ userId, isSharing }) => {
            console.log(`🖥️ Screen share status change: ${userId} isSharing: ${isSharing}`);
            setParticipants(prev =>
                prev.map(p => p.userId === userId ? {
                    ...p,
                    isScreenSharing: isSharing,
                    screenStream: isSharing ? p.screenStream : null
                } : p)
            );
        });

        socket.on('user-speaking', ({ userId, speaking }) => {
            if (speaking) {
                setActiveSpeaker(userId);
            } else if (activeSpeaker === userId) {
                setActiveSpeaker(null);
            }
        });

        // Waiting room events
        socket.on('waiting-users-list', (users) => {
            console.log('Received waiting users list:', users);
            if (isHostRef.current) {
                setWaitingUsers(users);
            }
        });

        socket.on('join-request', ({ userId, userName, socketId, timestamp }) => {
            console.log('Join request from:', userName, 'Is host (ref):', isHostRef.current);

            // CRITICAL: Use ref value instead of state to avoid stale closure
            if (isHostRef.current && userId !== user._id) {
                const request = { userId, userName, socketId, timestamp };
                console.log('✅ Adding to waiting users list and showing notification');
                setWaitingUsers(prev => {
                    const exists = prev.find(u => u.socketId === socketId);
                    if (exists) return prev;
                    return [...prev, request];
                });

                // Show host notification
                setLobbyNotification(request);
                // Clear notification after 10 seconds
                setTimeout(() => {
                    setLobbyNotification(prev => prev?.socketId === socketId ? null : prev);
                }, 10000);
            }
        });

        socket.on('admitted', ({ meetingId: admittedMeetingId }) => {
            console.log('Admitted to meeting');
            setIsWaiting(false);
            // Now join the room properly
            socket.emit('join-room', {
                meetingId: admittedMeetingId,
                userId: user._id,
                userName: user.name,
                isHost: false
            });
        });

        socket.on('rejected', ({ reason }) => {
            console.log('Rejected from meeting:', reason);
            alert(reason || 'Host denied your request to join');
            navigate('/');
        });

        // Signaling handlers
        socket.on('offer', ({ from, offer }) => {
            console.log('📡 Received offer from:', from);
            if (localStreamRef.current) {
                let peer = peersRef.current.get(from);
                if (!peer) {
                    const participant = participantsRef.current.find(p => p.peerId === from);
                    console.log(`🔨 Creating receiver peer for: ${participant?.userName || 'unknown yet'} (${from})`);

                    const streams = [localStreamRef.current];
                    if (screenSharingRef.current && screenStreamRef.current) {
                        streams.push(screenStreamRef.current);
                    }

                    peer = createPeer(from, participant?.userId, participant?.userName, streams, false);
                }
                peer.signal(offer);

                // Process queued ICE candidates
                if (iceCandidatesQueueRef.current.has(from)) {
                    console.log(`🧊 Processing ${iceCandidatesQueueRef.current.get(from).length} queued ICE candidates for: ${from}`);
                    iceCandidatesQueueRef.current.get(from).forEach(candidate => peer.signal(candidate));
                    iceCandidatesQueueRef.current.delete(from);
                }
            }
        });

        socket.on('answer', ({ from, answer }) => {
            console.log('📡 Received answer from:', from);
            const peer = peersRef.current.get(from);
            if (peer) {
                peer.signal(answer);
            }
        });

        socket.on('ice-candidate', ({ from, candidate }) => {
            const peer = peersRef.current.get(from);
            if (peer) {
                peer.signal(candidate);
            } else {
                console.log('🧊 Queuing ICE candidate from:', from);
                if (!iceCandidatesQueueRef.current.has(from)) {
                    iceCandidatesQueueRef.current.set(from, []);
                }
                iceCandidatesQueueRef.current.get(from).push(candidate);
            }
        });

        // Remote host controls
        socket.on('remote-mute', () => {
            console.log('🔇 Remote host muted you');
            if (micOn) {
                toggleMic();
            }
        });

        socket.on('remote-camera-off', () => {
            console.log('📷 Remote host turned off your camera');
            if (cameraOn) {
                toggleCamera();
            }
        });

        socket.on('remote-remove', () => {
            console.log('🚫 Remote host removed you from the meeting');
            alert('Host has removed you from the meeting');
            leaveMeeting();
        });
    };

    const createPeer = (peerId, userId, userName, streams, initiator) => {
        console.log(`🔨 Creating peer for ${userName} (${peerId}), initiator: ${initiator}`);

        const peer = new Peer({
            initiator,
            trickle: true,
            streams: Array.isArray(streams) ? streams : [streams],
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                ]
            }
        });

        peer.on('signal', (data) => {
            console.log('📡 Peer signal data:', data.type || 'ICE candidate');
            if (data.type === 'offer') {
                socket.emit('offer', { to: peerId, offer: data, from: socket.id });
            } else if (data.type === 'answer') {
                socket.emit('answer', { to: peerId, answer: data, from: socket.id });
            } else if (data.candidate) {
                socket.emit('ice-candidate', { to: peerId, candidate: data, from: socket.id });
            }
        });

        peer.on('stream', (remoteStream) => {
            console.log(`🎬 Received stream from: ${userName} (Stream ID: ${remoteStream.id})`);
            setParticipants(prev => {
                const participant = prev.find(p => p.peerId === peerId);
                if (participant) {
                    // Try to detect if this is a screen share
                    // Case 1: The stream has more than one track or a video track label indicating screen/display
                    // Case 2: We already have a primary stream and this one is different
                    // Case 3: The participant is ALREADY marked as sharing screen via socket

                    const videoTrack = remoteStream.getVideoTracks()[0];
                    const label = videoTrack?.label?.toLowerCase() || '';
                    const isScreenTrack = label.includes('screen') ||
                        label.includes('display') ||
                        label.includes('window');

                    // If participant is ALREADY sharing screen and this is their SECOND stream, 
                    // or if the label explicitly says it's a screen
                    const isProbablyScreen = isScreenTrack || (participant.isScreenSharing && participant.stream && participant.stream.id !== remoteStream.id);

                    if (isProbablyScreen) {
                        console.log(`🖥️ Assigning as SCREEN stream for: ${userName}`);
                        setParticipants(prev => prev.map(p => p.peerId === peerId ? {
                            ...p,
                            screenStream: remoteStream,
                            isScreenSharing: true
                        } : p));
                    } else {
                        console.log(`📷 Assigning as CAMERA stream for: ${userName}`);
                        setParticipants(prev => prev.map(p => p.peerId === peerId ? {
                            ...p,
                            stream: remoteStream
                        } : p));
                    }
                }
                return prev;
            });
        });

        peer.on('error', (err) => {
            console.error(`❌ Peer error (${userName}):`, err);
            // If it's a connection error, we might want to retry
        });

        peer.on('close', () => {
            console.log(`💨 Peer connection closed: ${userName}`);
            peersRef.current.delete(peerId);
        });

        // Add to tracking
        peersRef.current.set(peerId, peer);
        return peer;
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setMicOn(audioTrack.enabled);

            if (socket) {
                socket.emit('toggle-mic', {
                    meetingId,
                    userId: user._id,
                    micOn: audioTrack.enabled
                });
            }
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setCameraOn(videoTrack.enabled);

            if (socket) {
                socket.emit('toggle-camera', {
                    meetingId,
                    userId: user._id,
                    cameraOn: videoTrack.enabled
                });
            }
        }
    };

    const leaveMeeting = async () => {
        // End meeting if host is leaving
        if (isHost) {
            try {
                console.log('Host is leaving - ending meeting');
                await api.post(`/meetings/${meetingId}/end`);
                console.log('✅ Meeting ended successfully');
            } catch (error) {
                console.error('❌ Failed to end meeting:', error);
            }
        }

        cleanup();
        navigate('/');
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        peersRef.current.forEach((peer) => peer.destroy());
        peersRef.current.clear();

        if (socket) {
            socket.emit('leave-room', {
                meetingId,
                userId: user._id,
                userName: user.name,
                isHost
            });
        }
    };

    const handleRemoteMute = (participantUserId) => {
        if (socket && isHostRef.current) {
            socket.emit('mute-user', { meetingId, userId: participantUserId });
        }
    };

    const handleRemoteCameraOff = (participantUserId) => {
        if (socket && isHostRef.current) {
            socket.emit('disable-camera-user', { meetingId, userId: participantUserId });
        }
    };

    const handleRemoteRemove = (participantUserId) => {
        if (socket && isHostRef.current) {
            socket.emit('remove-user', { meetingId, userId: participantUserId });
        }
    };

    // Waiting room handlers
    const handleAdmitUser = (userToAdmit) => {
        if (socket) {
            socket.emit('admit-user', {
                socketId: userToAdmit.socketId,
                meetingId
            });
            // Remove from waiting list
            setWaitingUsers(prev => prev.filter(u => u.socketId !== userToAdmit.socketId));
        }
    };

    const handleRejectUser = (userToReject) => {
        if (socket) {
            socket.emit('reject-user', {
                socketId: userToReject.socketId,
                reason: 'Host denied your request to join'
            });
            // Remove from waiting list
            setWaitingUsers(prev => prev.filter(u => u.socketId !== userToReject.socketId));
        }
    };

    const toggleHandRaised = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        if (socket) {
            socket.emit('hand-raise', {
                meetingId,
                userId: user._id,
                userName: user.name,
                raised: newState
            });
        }
    };

    const toggleScreenShare = async () => {
        if (!screenSharing) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                screenStreamRef.current = stream;
                setScreenSharing(true);
                screenSharingRef.current = true;

                // Broadcast screen share status
                if (socket) {
                    socket.emit('screen-share-status', {
                        meetingId,
                        userId: user._id,
                        isSharing: true
                    });
                }

                // Add screen stream to all peers
                peersRef.current.forEach((peer) => {
                    peer.addStream(stream);
                });

                // Handle screen share stop (browser button)
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenSharing();
                };

            } catch (err) {
                console.error("Error sharing screen:", err);
            }
        } else {
            stopScreenSharing();
        }
    };

    const stopScreenSharing = () => {
        if (screenStreamRef.current) {
            const stream = screenStreamRef.current;
            stream.getTracks().forEach(track => track.stop());

            // Remove screen stream from all peers
            peersRef.current.forEach((peer) => {
                peer.removeStream(stream);
            });

            screenStreamRef.current = null;
        }

        setScreenSharing(false);
        screenSharingRef.current = false;

        // Broadcast screen share stop
        if (socket) {
            socket.emit('screen-share-status', {
                meetingId,
                userId: user._id,
                isSharing: false
            });
        }
    };

    const handleSendMessage = (content) => {
        if (socket && content.trim()) {
            socket.emit('chat-message', {
                meetingId,
                userId: user._id,
                userName: user.name,
                message: content.trim()
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-500 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Joining meeting...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark-500 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Show waiting room if user is waiting
    if (isWaiting) {
        return (
            <WaitingRoom
                meetingInfo={meeting}
                hostName={meeting?.host?.name || 'Host'}
            />
        );
    }

    return (
        <div className="h-screen bg-dark-500 flex flex-col overflow-hidden">
            <MeetingHeader meeting={meeting} />

            <div className="flex-1 flex overflow-hidden">
                {/* Main Grid */}
                <div className="flex-1 p-4">
                    <ParticipantGrid
                        localStream={localStream}
                        localVideoRef={localVideoRef}
                        participants={participants}
                        user={user}
                        activeSpeaker={activeSpeaker}
                        micOn={micOn}
                        cameraOn={cameraOn}
                        localHandRaised={handRaised}
                        localScreenStream={screenStreamRef.current}
                        isLocalScreenSharing={screenSharing}
                    />
                </div>

                {/* Chat Sidebar */}
                {chatOpen && (
                    <ChatSidebar
                        meetingId={meetingId}
                        onClose={() => setChatOpen(false)}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                    />
                )}

                {/* Participants Sidebar */}
                {participantsOpen && (
                    <ParticipantsSidebar
                        participants={[{ userId: user._id, userName: user.name, micOn, cameraOn, isHost: true }, ...participants]}
                        waitingUsers={waitingUsers}
                        onAdmit={handleAdmitUser}
                        onReject={handleRejectUser}
                        onClose={() => setParticipantsOpen(false)}
                        isCurrentUserHost={isHost}
                        currentUserId={user._id}
                        onMute={handleRemoteMute}
                        onDisableCamera={handleRemoteCameraOff}
                        onRemove={handleRemoteRemove}
                    />
                )}

                {/* Admit Panel (for host only) */}
                <AnimatePresence>
                    {isHost && admitPanelOpen && (
                        <AdmitPanel
                            waitingUsers={waitingUsers}
                            onAdmit={handleAdmitUser}
                            onReject={handleRejectUser}
                            onClose={() => setAdmitPanelOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Control Bar */}
            <ControlBar
                micOn={micOn}
                cameraOn={cameraOn}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onToggleChat={() => setChatOpen(!chatOpen)}
                onToggleParticipants={() => setParticipantsOpen(!participantsOpen)}
                onLeaveMeeting={leaveMeeting}
                participantCount={participants.length + 1}
                meetingId={meetingId}
                waitingCount={isHost ? waitingUsers.length : 0}
                onOpenAdmitPanel={() => setAdmitPanelOpen(true)}
                onToggleHand={toggleHandRaised}
                handRaised={handRaised}
                onToggleScreenShare={toggleScreenShare}
                screenSharing={screenSharing}
            />
            <ChatNotification
                message={newNotification}
                onClose={() => setNewNotification(null)}
            />
            <LobbyNotification
                user={lobbyNotification}
                onAdmit={handleAdmitUser}
                onReject={handleRejectUser}
                onClose={() => setLobbyNotification(null)}
            />
        </div>
    );
}