import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Plus, LogIn, Calendar, BarChart3, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Home() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const { data } = await api.get(`/meetings/user/${user._id}`);
            if (data.success) {
                setMeetings(data.data.slice(0, 10)); // Show last 10 meetings
            }
        } catch (error) {
            console.error('Failed to load meetings:', error);
        }
    };

    const createInstantMeeting = async () => {
        if (loading) return;

        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/meetings/create', {
                title: `${user.name}'s Meeting`
            });

            if (data.success) {
                console.log('Meeting created:', data.data);
                // Navigate to meeting room
                navigate(`/meeting/${data.data.meetingId}`);
            } else {
                throw new Error(data.message || 'Failed to create meeting');
            }
        } catch (error) {
            console.error('Failed to create meeting:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create meeting. Please try again.';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const joinMeeting = (e) => {
        e.preventDefault();
        let code = joinCode.trim();

        // If it's a full URL, extract the code (last part after /)
        if (code.includes('/')) {
            const parts = code.split('/');
            code = parts[parts.length - 1];
        }

        if (code) {
            navigate(`/meeting/${code}`);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
            {/* Header */}
            <header className="glass border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary-500 rounded-lg">
                                <Video className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Google Meet</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/analytics"
                                className="flex items-center space-x-2 px-4 py-2 bg-dark-300 hover:bg-dark-200 rounded-lg transition-colors"
                            >
                                <BarChart3 className="w-5 h-5" />
                                <span className="hidden sm:inline">Analytics</span>
                            </Link>

                            <div className="flex items-center space-x-3 px-4 py-2 bg-dark-300 rounded-lg">
                                <User className="w-5 h-5 text-primary-500" />
                                <span className="text-white font-medium hidden sm:inline">{user?.name}</span>
                            </div>

                            <button
                                onClick={logout}
                                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 text-gray-400 hover:text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Video calls and meetings for everyone
                    </h2>
                    <p className="text-xl text-gray-400">
                        Connect, collaborate and celebrate from anywhere
                    </p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg"
                    >
                        <p className="font-medium">{error}</p>
                    </motion.div>
                )}

                {/* Action Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Create Meeting */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-8 hover-lift"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-primary-500 rounded-full">
                                <Plus className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">Create Instant Meeting</h3>
                                <p className="text-gray-400 mb-4">
                                    Start a new meeting instantly and invite others to join
                                </p>
                                <button
                                    onClick={createInstantMeeting}
                                    disabled={loading}
                                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'New Meeting'}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Join Meeting */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-8 hover-lift"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-green-500 rounded-full">
                                <LogIn className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">Join a Meeting</h3>
                                <p className="text-gray-400 mb-4">
                                    Enter a meeting code or link to join an existing meeting
                                </p>
                                <form onSubmit={joinMeeting} className="space-y-3">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        placeholder="Enter meeting code"
                                        className="w-full px-4 py-3 bg-dark-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Join
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Meetings */}
                {meetings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-semibold text-white flex items-center space-x-2">
                                <Calendar className="w-6 h-6 text-primary-500" />
                                <span>Recent Meetings</span>
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {meetings.map((meeting) => (
                                <div
                                    key={meeting._id}
                                    onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                                    className="flex items-center justify-between p-4 bg-dark-300 hover:bg-dark-200 rounded-lg cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-primary-500/20 rounded-lg">
                                            <Video className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{meeting.title}</h4>
                                            <p className="text-sm text-gray-400">
                                                {meeting.status === 'live' ? (
                                                    <span className="text-green-500">● Live Now</span>
                                                ) : (
                                                    formatDate(meeting.scheduledTime)
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        Code: <span className="text-primary-500 font-mono">{meeting.meetingId}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
