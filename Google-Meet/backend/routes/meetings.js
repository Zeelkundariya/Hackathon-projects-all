import express from 'express';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/meetings/create
// @desc    Create a new meeting
// @access  Private
router.post('/create', protect, async (req, res) => {
    try {
        const { title, scheduledTime, settings } = req.body;

        const isInstant = !scheduledTime;
        const currentTime = Date.now();

        const meeting = await Meeting.create({
            title: title || 'Instant Meeting',
            host: req.user._id,
            scheduledTime: scheduledTime || currentTime,
            startTime: isInstant ? currentTime : null,
            settings: settings || {},
            status: isInstant ? 'live' : 'scheduled',
            participants: [{
                userId: req.user._id,
                name: req.user.name,
                isHost: true,
                joinedAt: isInstant ? currentTime : null
            }]
        });

        // Initialize analytics for the meeting
        const Analytics = (await import('../models/Analytics.js')).default;
        await Analytics.create({
            meetingId: meeting._id,
            participantMetrics: [{
                userId: req.user._id,
                name: req.user.name,
                speakingTime: 0,
                videoOnTime: 0,
                attendanceDuration: 0,
                reactionsSent: 0,
                handRaises: 0,
                messagesSent: 0,
                networkQuality: { average: 0, samples: [] },
                engagementScore: 0
            }],
            totalSpeakingTime: 0,
            averageEngagement: 0,
            peakParticipants: 1,
            totalMessages: 0,
            totalReactions: 0
        });

        res.status(201).json({
            success: true,
            data: meeting,
            message: isInstant ? 'Instant meeting created successfully' : 'Meeting scheduled successfully'
        });
    } catch (error) {
        console.error('Meeting creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create meeting'
        });
    }
});

// @route   GET /api/meetings/:id
// @desc    Get meeting by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ meetingId: req.params.id })
            .populate('host', 'name email profilePicture');

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        res.json({
            success: true,
            data: meeting
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/meetings/:id/join
// @desc    Join a meeting
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ meetingId: req.params.id });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Check if user already in participants
        const alreadyJoined = meeting.participants.find(
            p => p.userId.toString() === req.user._id.toString()
        );

        if (!alreadyJoined) {
            meeting.participants.push({
                userId: req.user._id,
                name: req.user.name,
                isHost: false
            });

            // Update meeting status to live if not already
            if (meeting.status === 'scheduled') {
                meeting.status = 'live';
                meeting.startTime = Date.now();
            }

            await meeting.save();
        }

        res.json({
            success: true,
            data: meeting
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/meetings/:id/end
// @desc    End a meeting
// @access  Private
router.post('/:id/end', protect, async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ meetingId: req.params.id });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Check if user is host
        if (meeting.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the host can end the meeting'
            });
        }

        meeting.status = 'ended';
        meeting.endTime = Date.now();

        // Calculate duration in minutes
        if (meeting.startTime) {
            meeting.duration = Math.round((meeting.endTime - meeting.startTime) / 60000);
        }

        await meeting.save();

        res.json({
            success: true,
            data: meeting
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/meetings/user/:userId
// @desc    Get user's meetings
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const meetings = await Meeting.find({
            $or: [
                { host: req.params.userId },
                { 'participants.userId': req.params.userId }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('host', 'name email profilePicture');

        res.json({
            success: true,
            count: meetings.length,
            data: meetings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/meetings/:id/messages
// @desc    Get chat messages for a meeting
// @access  Private
router.get('/:id/messages', protect, async (req, res) => {
    try {
        const ChatMessage = (await import('../models/ChatMessage.js')).default;
        const messages = await ChatMessage.find({ meetingId: req.params.id })
            .sort({ timestamp: 1 })
            .limit(100);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
