import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: String,
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: Date,
    isHost: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        unique: true,
        index: true
    },
    title: {
        type: String,
        default: 'Instant Meeting'
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledTime: Date,
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    participants: [participantSchema],
    settings: {
        waitingRoom: {
            type: Boolean,
            default: false
        },
        recording: {
            type: Boolean,
            default: false
        },
        allowScreenShare: {
            type: Boolean,
            default: true
        },
        allowChat: {
            type: Boolean,
            default: true
        },
        maxParticipants: {
            type: Number,
            default: 50
        }
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'ended'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate meeting ID before saving
meetingSchema.pre('save', function (next) {
    if (!this.meetingId) {
        this.meetingId = generateMeetingId();
    }
    next();
});

// Helper function to generate meeting ID
function generateMeetingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 2) id += '-';
    }
    return id; // Format: xxxx-xxxx-xxxx
}

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
