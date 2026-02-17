import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const { data } = await api.get(`/meetings/user/${user._id}`);
            if (data.success) {
                const endedMeetings = data.data.filter(m => m.status === 'ended');
                setMeetings(endedMeetings);
                if (endedMeetings.length > 0) {
                    loadAnalytics(endedMeetings[0]._id);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to load meetings:', error);
            setLoading(false);
        }
    };

    const loadAnalytics = async (meetingId) => {
        try {
            const { data } = await api.get(`/analytics/meeting/${meetingId}`);
            if (data.success) {
                setSelectedMeeting(data.data.meeting);
                setAnalytics(data.data.analytics);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    };

    const exportData = async () => {
        if (!selectedMeeting) return;

        try {
            const { data } = await api.get(`/analytics/export/${selectedMeeting._id}`);
            if (data.success) {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-analytics-${selectedMeeting.meetingId}.json`;
                a.click();
            }
        } catch (error) {
            console.error('Failed to export data:', error);
        }
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Prepare chart data
    const speakingTimeData = analytics?.participantMetrics.map(pm => ({
        name: pm.name?.split(' ')[0] || 'Unknown',
        speakingTime: Math.floor(pm.speakingTime / 60), // convert to minutes
        engagementScore: pm.engagementScore || 0
    })) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-500 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
            {/* Header */}
            <header className="glass border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Home</span>
                        </button>

                        <h1 className="text-2xl font-bold text-white">Meeting Analytics</h1>

                        {selectedMeeting && (
                            <button
                                onClick={exportData}
                                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                <span>Export</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {meetings.length === 0 ? (
                    <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-xl text-gray-400 mb-2">No meeting analytics available</p>
                        <p className="text-gray-500">Complete a meeting to see analytics here</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Meeting Selector */}
                        <div className="glass rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Select Meeting
                            </label>
                            <select
                                onChange={(e) => loadAnalytics(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                            >
                                {meetings.map((meeting) => (
                                    <option key={meeting._id} value={meeting._id}>
                                        {meeting.title} - {formatDate(meeting.startTime)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedMeeting && analytics && (
                            <>
                                {/* Overview Cards */}
                                <div className="grid md:grid-cols-4 gap-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass rounded-2xl p-6"
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Users className="w-8 h-8 text-primary-500" />
                                            <h3 className="text-gray-400">Participants</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {selectedMeeting.participants.length}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="glass rounded-2xl p-6"
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Clock className="w-8 h-8 text-green-500" />
                                            <h3 className="text-gray-400">Duration</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {formatDuration(selectedMeeting.duration || 0)}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="glass rounded-2xl p-6"
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <TrendingUp className="w-8 h-8 text-yellow-500" />
                                            <h3 className="text-gray-400">Messages</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {analytics.totalMessages || 0}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="glass rounded-2xl p-6"
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <TrendingUp className="w-8 h-8 text-purple-500" />
                                            <h3 className="text-gray-400">Reactions</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {analytics.totalReactions || 0}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Speaking Time Chart */}
                                {speakingTimeData.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="glass rounded-2xl p-6"
                                    >
                                        <h3 className="text-xl font-semibold text-white mb-6">
                                            Speaking Time per Participant (minutes)
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={speakingTimeData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#3c4043" />
                                                <XAxis dataKey="name" stroke="#9aa0a6" />
                                                <YAxis stroke="#9aa0a6" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#202124',
                                                        border: '1px solid #3c4043',
                                                        borderRadius: '8px',
                                                        color: '#e8eaed'
                                                    }}
                                                />
                                                <Legend />
                                                <Bar dataKey="speakingTime" fill="#1a73e8" name="Speaking Time" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </motion.div>
                                )}

                                {/* Participant Insights Table */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="glass rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-semibold text-white mb-6">
                                        Participant Details
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Speaking Time</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Messages</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Reactions</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Engagement</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics.participantMetrics.map((pm, index) => (
                                                    <tr key={index} className="border-b border-gray-700/50 hover:bg-dark-300/50">
                                                        <td className="py-3 px-4 text-white">{pm.name}</td>
                                                        <td className="py-3 px-4 text-gray-300">
                                                            {Math.floor(pm.speakingTime / 60)}m {pm.speakingTime % 60}s
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-300">{pm.messagesSent || 0}</td>
                                                        <td className="py-3 px-4 text-gray-300">{pm.reactionsSent || 0}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm">
                                                                {pm.engagementScore || 0}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
