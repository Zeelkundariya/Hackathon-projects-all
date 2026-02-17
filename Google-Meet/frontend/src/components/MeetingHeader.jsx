import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function MeetingHeader({ meeting }) {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (meeting?.startTime) {
                const elapsed = Math.floor((Date.now() - new Date(meeting.startTime)) / 1000);
                setDuration(elapsed);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [meeting]);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-dark-400 border-b border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-white">
                    {meeting?.title || 'Meeting'}
                </h1>

                <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-mono">{formatDuration(duration)}</span>
                </div>
            </div>
        </div>
    );
}
