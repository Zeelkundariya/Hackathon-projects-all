import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

export default function ChatSidebar({ meetingId, onClose, messages, onSendMessage }) {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            className="w-80 bg-dark-400 border-l border-gray-700 flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Chat</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className={msg.type === 'system' ? 'text-center' : ''}>
                            {msg.type === 'system' ? (
                                <p className="text-xs text-gray-500">{msg.message}</p>
                            ) : (
                                <div>
                                    <div className="flex items-baseline space-x-2 mb-1">
                                        <span className="text-sm font-medium text-primary-500">
                                            {msg.sender.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                    <div className="bg-dark-300 rounded-lg px-3 py-2">
                                        <p className="text-sm text-white">{msg.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-dark-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
