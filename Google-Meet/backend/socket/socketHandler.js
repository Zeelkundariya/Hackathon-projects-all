import ChatMessage from '../models/ChatMessage.js';

// Store active rooms, participants and waiting users
const rooms = new Map();
const waitingUsersMap = new Map(); // Store join requests: meetingId -> Map(socketId -> {userId, userName, timestamp})
const approvedUsersMap = new Map(); // Store persistent approvals: meetingId -> Set(userId)

export const initializeSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.id}`);

        // Join a meeting room
        socket.on('join-room', async ({ meetingId, userId, userName, isHost }) => {
            console.log(`User ${userName} joining room ${meetingId}`);
            socket.join(meetingId);

            // Store user info in socket
            socket.userId = userId;
            socket.userName = userName;
            socket.meetingId = meetingId;
            socket.isHost = isHost;

            // Add user to room tracking
            if (!rooms.has(meetingId)) {
                rooms.set(meetingId, new Map());
            }
            const room = rooms.get(meetingId);
            room.set(socket.id, { userId, userName, peerId: socket.id, isHost });

            // If host joins, send them the list of waiting users
            if (isHost && waitingUsersMap.has(meetingId)) {
                const waitingList = Array.from(waitingUsersMap.get(meetingId).values());
                console.log(`Syncing ${waitingList.length} waiting users to host ${userName}`);
                socket.emit('waiting-users-list', waitingList);
            }

            // Notify others in the room
            socket.to(meetingId).emit('user-joined', {
                userId,
                userName,
                peerId: socket.id
            });

            // Send existing participants to the new user
            const participants = Array.from(room.values()).filter(p => p.userId !== userId);
            socket.emit('existing-participants', participants);

            // Save system message
            await ChatMessage.create({
                meetingId,
                sender: { name: 'System' },
                message: `${userName} joined the meeting`,
                type: 'system'
            });

            console.log(`User ${userName} joined room ${meetingId}`);
        });

        // Waiting room - Request to join
        socket.on('request-to-join', async ({ meetingId, userId, userName }) => {
            console.log(`User ${userName} requesting to join ${meetingId}`);

            // Check if user is already approved for this meeting
            if (approvedUsersMap.has(meetingId) && approvedUsersMap.get(meetingId).has(userId)) {
                console.log(`✅ User ${userName} is already persistent-approved. Admitting immediately.`);
                socket.join(meetingId);
                socket.isWaiting = false;

                // Add to room tracking
                if (!rooms.has(meetingId)) rooms.set(meetingId, new Map());
                const room = rooms.get(meetingId);
                room.set(socket.id, { userId, userName, peerId: socket.id, isHost: false });

                // Tell the user they're admitted
                socket.emit('admitted', { meetingId });

                // Notify ALL in room about new user (including host)
                io.to(meetingId).emit('user-joined', { userId, userName, peerId: socket.id });

                // Send existing participants
                const participants = Array.from(room.values()).filter(p => p.userId !== userId);
                socket.emit('existing-participants', participants);
                return;
            }

            // Store in socket for tracking
            socket.userId = userId;
            socket.userName = userName;
            socket.meetingId = meetingId;
            socket.isWaiting = true;

            // Add to waiting users map
            if (!waitingUsersMap.has(meetingId)) {
                waitingUsersMap.set(meetingId, new Map());
            }
            const waitingRoom = waitingUsersMap.get(meetingId);
            const requestData = {
                userId,
                userName,
                socketId: socket.id,
                timestamp: Date.now()
            };
            waitingRoom.set(socket.id, requestData);

            // Emit to ALL sockets in the room (host should be there already)
            io.to(meetingId).emit('join-request', requestData);

            console.log(`Sent join request to room ${meetingId}`);
        });

        // Host admits a user
        socket.on('admit-user', ({ socketId, meetingId }) => {
            console.log(`Admitting user with socket ${socketId} to ${meetingId}`);

            // Remove from waiting users map
            if (waitingUsersMap.has(meetingId)) {
                waitingUsersMap.get(meetingId).delete(socketId);
            }

            // Find the waiting user's socket
            const waitingSocket = io.sockets.sockets.get(socketId);

            if (waitingSocket && waitingSocket.isWaiting) {
                waitingSocket.isWaiting = false;
                waitingSocket.join(meetingId);

                // Add to persistent approval map
                if (!approvedUsersMap.has(meetingId)) {
                    approvedUsersMap.set(meetingId, new Set());
                }
                approvedUsersMap.get(meetingId).add(waitingSocket.userId);

                // Add to room tracking
                if (!rooms.has(meetingId)) {
                    rooms.set(meetingId, new Map());
                }
                const room = rooms.get(meetingId);
                room.set(socketId, {
                    userId: waitingSocket.userId,
                    userName: waitingSocket.userName,
                    peerId: socketId
                });

                // Tell the user they're admitted
                io.to(socketId).emit('admitted', { meetingId });

                // Notify ALL participants about new user (especially the host)
                io.to(meetingId).emit('user-joined', {
                    userId: waitingSocket.userId,
                    userName: waitingSocket.userName,
                    peerId: socketId
                });

                // Send existing participants to the newly admitted user
                const participants = Array.from(room.values()).filter(p => p.userId !== waitingSocket.userId);
                io.to(socketId).emit('existing-participants', participants);
            }
        });

        // Host rejects a user
        socket.on('reject-user', ({ socketId, reason, meetingId }) => {
            console.log(`Rejecting user with socket ${socketId} from ${meetingId}`);

            // Remove from waiting users map
            if (waitingUsersMap.has(meetingId)) {
                waitingUsersMap.get(meetingId).delete(socketId);
            }

            // Tell the user they're rejected
            io.to(socketId).emit('rejected', {
                reason: reason || 'Host denied your request to join'
            });
        });

        // WebRTC Signaling - Offer
        socket.on('offer', ({ to, offer, from }) => {
            socket.to(to).emit('offer', { from, offer });
        });

        // WebRTC Signaling - Answer
        socket.on('answer', ({ to, answer, from }) => {
            socket.to(to).emit('answer', { from, answer });
        });

        // WebRTC Signaling - ICE Candidate
        socket.on('ice-candidate', ({ to, candidate, from }) => {
            socket.to(to).emit('ice-candidate', { from, candidate });
        });

        // Chat message
        socket.on('chat-message', async ({ meetingId, userId, userName, message }) => {
            // Save to database
            const chatMessage = await ChatMessage.create({
                meetingId,
                sender: { userId, name: userName },
                message,
                type: 'text'
            });

            // Broadcast to room
            io.to(meetingId).emit('chat-message', {
                _id: chatMessage._id,
                sender: { userId, name: userName },
                message,
                timestamp: chatMessage.timestamp
            });
        });

        // Reactions
        socket.on('send-reaction', ({ meetingId, userId, userName, reaction }) => {
            io.to(meetingId).emit('reaction', {
                userId,
                userName,
                reaction,
                timestamp: Date.now()
            });
        });

        // Hand raise
        socket.on('hand-raise', ({ meetingId, userId, userName, raised }) => {
            socket.to(meetingId).emit('hand-raise', {
                userId,
                userName,
                raised
            });
        });

        // Active speaker detection
        socket.on('speaking', ({ meetingId, userId, userName, speaking }) => {
            socket.to(meetingId).emit('user-speaking', {
                userId,
                userName,
                speaking
            });
        });

        // Toggle mic
        socket.on('toggle-mic', ({ meetingId, userId, micOn }) => {
            socket.to(meetingId).emit('user-mic-toggle', {
                userId,
                micOn
            });
        });

        // Toggle camera
        socket.on('toggle-camera', ({ meetingId, userId, cameraOn }) => {
            socket.to(meetingId).emit('user-camera-toggle', {
                userId,
                cameraOn
            });
        });

        // Screen share
        socket.on('screen-share-status', ({ meetingId, userId, isSharing }) => {
            // Update room tracking
            if (rooms.has(meetingId)) {
                const room = rooms.get(meetingId);
                const participant = room.get(socket.id);
                if (participant) {
                    participant.isScreenSharing = isSharing;
                }
            }

            socket.to(meetingId).emit('screen-share-status', {
                userId,
                isSharing
            });
        });

        socket.on('start-screen-share', ({ meetingId, userId, userName }) => {
            socket.to(meetingId).emit('screen-share-started', {
                userId,
                userName,
                peerId: socket.id
            });
        });

        socket.on('stop-screen-share', ({ meetingId, userId }) => {
            socket.to(meetingId).emit('screen-share-stopped', {
                userId
            });
        });

        // Host Remote Controls
        socket.on('mute-user', ({ meetingId, userId }) => {
            console.log(`Host requested to mute user ${userId} in ${meetingId}`);
            // Find the socket of the target user
            let targetSocketId = null;
            if (rooms.has(meetingId)) {
                const room = rooms.get(meetingId);
                for (const [sId, data] of room.entries()) {
                    if (data.userId === userId) {
                        targetSocketId = sId;
                        break;
                    }
                }
            }
            if (targetSocketId) {
                io.to(targetSocketId).emit('remote-mute');
            }
        });

        socket.on('disable-camera-user', ({ meetingId, userId }) => {
            console.log(`Host requested to disable camera for user ${userId} in ${meetingId}`);
            let targetSocketId = null;
            if (rooms.has(meetingId)) {
                const room = rooms.get(meetingId);
                for (const [sId, data] of room.entries()) {
                    if (data.userId === userId) {
                        targetSocketId = sId;
                        break;
                    }
                }
            }
            if (targetSocketId) {
                io.to(targetSocketId).emit('remote-camera-off');
            }
        });

        socket.on('remove-user', ({ meetingId, userId }) => {
            console.log(`Host requested to remove user ${userId} from ${meetingId}`);
            let targetSocketId = null;
            if (rooms.has(meetingId)) {
                const room = rooms.get(meetingId);
                for (const [sId, data] of room.entries()) {
                    if (data.userId === userId) {
                        targetSocketId = sId;
                        break;
                    }
                }
            }
            if (targetSocketId) {
                io.to(targetSocketId).emit('remote-remove');
            }
        });

        // Leave room
        socket.on('leave-room', async ({ meetingId, userId, userName, isHost }) => {
            socket.leave(meetingId);

            // Remove from room tracking
            let newHost = null;
            if (rooms.has(meetingId)) {
                const room = rooms.get(meetingId);
                room.delete(socket.id);

                // If host is leaving and there are other participants, transfer host
                if (isHost && room.size > 0) {
                    const newHostSocketEntry = Array.from(room.entries())[0];
                    const [socketId, newHostData] = newHostSocketEntry;
                    newHost = {
                        userId: newHostData.userId,
                        userName: newHostData.userName
                    };

                    // Update the new host's socket object
                    const targetSocket = io.sockets.sockets.get(socketId);
                    if (targetSocket) {
                        targetSocket.isHost = true;
                        // Send the waiting list to the new host
                        if (waitingUsersMap.has(meetingId)) {
                            const waitingList = Array.from(waitingUsersMap.get(meetingId).values());
                            targetSocket.emit('waiting-users-list', waitingList);
                        }
                    }

                    console.log(`Transferring host to ${newHostData.userName}`);
                }

                if (room.size === 0) {
                    rooms.delete(meetingId);
                }
            }

            // Notify others
            const leaveData = {
                userId,
                userName,
                peerId: socket.id
            };

            if (newHost) {
                leaveData.newHost = newHost;
            }

            socket.to(meetingId).emit('user-left', leaveData);

            // Save system message
            await ChatMessage.create({
                meetingId,
                sender: { name: 'System' },
                message: `${userName} left the meeting${newHost ? `. ${newHost.userName} is now the host.` : ''}`,
                type: 'system'
            });

            console.log(`User ${userName} left room ${meetingId}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.id}`);

            // Clean up from all waiting rooms
            waitingUsersMap.forEach((waitingRoom, meetingId) => {
                if (waitingRoom.has(socket.id)) {
                    waitingRoom.delete(socket.id);
                    if (waitingRoom.size === 0) {
                        waitingUsersMap.delete(meetingId);
                    }
                }
            });

            // Clean up from all active rooms
            rooms.forEach((room, meetingId) => {
                if (room.has(socket.id)) {
                    const user = room.get(socket.id);
                    room.delete(socket.id);

                    socket.to(meetingId).emit('user-left', {
                        userId: user.userId,
                        userName: user.userName,
                        peerId: socket.id
                    });

                    if (room.size === 0) {
                        rooms.delete(meetingId);
                    }
                }
            });
        });
    });
};
