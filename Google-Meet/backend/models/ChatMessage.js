import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
chatMessageSchema.index({ meetingId: 1, timestamp: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
