import mongoose from 'mongoose';

const participantMetricsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: String,
    speakingTime: {
        type: Number,
        default: 0 // in seconds
    },
    videoOnTime: {
        type: Number,
        default: 0 // in seconds
    },
    attendanceDuration: {
        type: Number,
        default: 0 // in seconds
    },
    reactionsSent: {
        type: Number,
        default: 0
    },
    handRaises: {
        type: Number,
        default: 0
    },
    messagesSent: {
        type: Number,
        default: 0
    },
    networkQuality: {
        average: Number,
        samples: [Number]
    },
    engagementScore: {
        type: Number,
        default: 0 // 0-100 calculated score
    }
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true,
        unique: true
    },
    participantMetrics: [participantMetricsSchema],
    totalSpeakingTime: {
        type: Number,
        default: 0
    },
    averageEngagement: {
        type: Number,
        default: 0
    },
    peakParticipants: {
        type: Number,
        default: 0
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    totalReactions: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
analyticsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate engagement score for a participant
analyticsSchema.methods.calculateEngagementScore = function (participantMetric, meetingDuration) {
    const weights = {
        speaking: 0.4,
        video: 0.2,
        attendance: 0.2,
        interactions: 0.2
    };

    const speakingScore = Math.min((participantMetric.speakingTime / meetingDuration) * 100, 100);
    const videoScore = (participantMetric.videoOnTime / participantMetric.attendanceDuration) * 100;
    const attendanceScore = (participantMetric.attendanceDuration / meetingDuration) * 100;
    const interactionScore = Math.min(
        ((participantMetric.reactionsSent + participantMetric.messagesSent + participantMetric.handRaises) / 10) * 100,
        100
    );

    return (
        speakingScore * weights.speaking +
        videoScore * weights.video +
        attendanceScore * weights.attendance +
        interactionScore * weights.interactions
    ).toFixed(2);
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
