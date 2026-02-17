import express from 'express';
import Analytics from '../models/Analytics.js';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/analytics/meeting/:meetingId
// @desc    Get analytics for a specific meeting
// @access  Private
router.get('/meeting/:meetingId', protect, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        let analytics = await Analytics.findOne({ meetingId: req.params.meetingId });

        // If analytics don't exist yet, create placeholder
        if (!analytics) {
            analytics = await Analytics.create({
                meetingId: req.params.meetingId,
                participantMetrics: []
            });
        }

        res.json({
            success: true,
            data: {
                meeting,
                analytics
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/analytics/track
// @desc    Track analytics event
// @access  Private
router.post('/track', protect, async (req, res) => {
    try {
        const { meetingId, userId, eventType, value } = req.body;

        let analytics = await Analytics.findOne({ meetingId });

        if (!analytics) {
            analytics = await Analytics.create({
                meetingId,
                participantMetrics: []
            });
        }

        // Find or create participant metric
        let participantMetric = analytics.participantMetrics.find(
            p => p.userId.toString() === userId
        );

        if (!participantMetric) {
            participantMetric = {
                userId,
                name: req.user.name,
                speakingTime: 0,
                videoOnTime: 0,
                attendanceDuration: 0,
                reactionsSent: 0,
                handRaises: 0,
                messagesSent: 0,
                networkQuality: { average: 0, samples: [] },
                engagementScore: 0
            };
            analytics.participantMetrics.push(participantMetric);
        } else {
            participantMetric = analytics.participantMetrics.find(
                p => p.userId.toString() === userId
            );
        }

        // Update based on event type
        switch (eventType) {
            case 'speaking_time':
                participantMetric.speakingTime += value;
                analytics.totalSpeakingTime += value;
                break;
            case 'video_on_time':
                participantMetric.videoOnTime += value;
                break;
            case 'attendance':
                participantMetric.attendanceDuration = value;
                break;
            case 'reaction':
                participantMetric.reactionsSent += 1;
                analytics.totalReactions += 1;
                break;
            case 'hand_raise':
                participantMetric.handRaises += 1;
                break;
            case 'message':
                participantMetric.messagesSent += 1;
                analytics.totalMessages += 1;
                break;
            case 'network_quality':
                participantMetric.networkQuality.samples.push(value);
                participantMetric.networkQuality.average =
                    participantMetric.networkQuality.samples.reduce((a, b) => a + b, 0) /
                    participantMetric.networkQuality.samples.length;
                break;
        }

        await analytics.save();

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/analytics/export/:meetingId
// @desc    Export analytics data
// @access  Private
router.get('/export/:meetingId', protect, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        const analytics = await Analytics.findOne({ meetingId: req.params.meetingId });

        if (!meeting || !analytics) {
            return res.status(404).json({
                success: false,
                message: 'Meeting or analytics not found'
            });
        }

        // Calculate engagement scores
        const meetingDuration = meeting.duration * 60; // convert to seconds
        analytics.participantMetrics.forEach(pm => {
            pm.engagementScore = analytics.calculateEngagementScore(pm, meetingDuration);
        });

        // Format data for export
        const exportData = {
            meeting: {
                title: meeting.title,
                date: meeting.startTime,
                duration: meeting.duration,
                participants: meeting.participants.length
            },
            analytics: {
                totalSpeakingTime: analytics.totalSpeakingTime,
                totalMessages: analytics.totalMessages,
                totalReactions: analytics.totalReactions,
                participants: analytics.participantMetrics.map(pm => ({
                    name: pm.name,
                    speakingTime: `${Math.floor(pm.speakingTime / 60)}m ${pm.speakingTime % 60}s`,
                    videoOnPercentage: `${((pm.videoOnTime / pm.attendanceDuration) * 100).toFixed(1)}%`,
                    attendanceDuration: `${Math.floor(pm.attendanceDuration / 60)}m`,
                    interactions: pm.reactionsSent + pm.messagesSent + pm.handRaises,
                    engagementScore: pm.engagementScore
                }))
            }
        };

        res.json({
            success: true,
            data: exportData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
