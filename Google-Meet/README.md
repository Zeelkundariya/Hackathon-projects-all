# Google Meet - Smart Meeting Experience

A modern reimagination of Google Meet with intelligent participant grid system, intuitive controls, and comprehensive meeting analytics.

## Features

### 🎥 Smart Participant Grid
- Dynamic layouts that adapt to 1-16+ participants
- Active speaker detection and highlighting
- Pin and spotlight modes
- Smooth animated transitions

### 🎛️ Intuitive Controls
- Mic and camera toggles
- Screen sharing
- Real-time chat
- Reactions and hand raise
- Participants list

### 📊 Meeting Analytics Dashboard
- Speaking time visualization
- Engagement metrics
- Participant insights
- Export analytics data

### 🔧 Technical Stack
- **Backend**: Node.js, Express, Socket.io, MongoDB
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Real-time**: WebRTC for video/audio, Socket.io for signaling

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Configure Environment Variables**
Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/google-meet
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

4. **Start MongoDB**
```bash
# Windows (if MongoDB installed as service)
net start MongoDB

# Or start manually
mongod
```

5. **Start Backend Server**
```bash
cd backend
npm run dev
```

6. **Frontend Setup** (in a new terminal)
```bash
cd frontend
npm install
```

7. **Start Frontend Development Server**
```bash
npm run dev
```

8. **Access the Application**
Open your browser to: http://localhost:5173

## Usage

### Creating a Meeting
1. Register/Login with your credentials
2. Click "New Meeting" to create an instant meeting
3. Share the meeting code with participants

### Joining a Meeting
1. Enter the meeting code in the "Join a Meeting" section
2. Allow camera and microphone permissions
3. Click "Join"

### During the Meeting
- Use the control bar to toggle mic/camera
- Click chat icon to open messaging
- Click participants icon to see attendees
- View active speaker with highlighted border
- Click the red phone icon to leave

### Viewing Analytics
1. Navigate to Analytics from the home page
2. Select a completed meeting
3. View speaking time charts and participant metrics
4. Export data as JSON

## Development

### Project Structure
```
google-meet/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── socket/          # Socket.io handlers
│   ├── middleware/      # Auth middleware
│   └── server.js        # Entry point
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── context/     # React context
    │   └── utils/       # Utilities
    └── public/
```

### Key Technologies
- **WebRTC**: Peer-to-peer video/audio streaming
- **Socket.io**: Real-time signaling and chat
- **MongoDB**: Meeting and analytics data storage
- **JWT**: Authentication
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Recharts**: Analytics visualization

## Features Overview

### Smart Grid System
The participant grid automatically adjusts:
- 1 participant: Full screen
- 2-4: 2x2 grid
- 5-9: 3x3 grid
- 10-16: 4x4 grid
- 17+: Scrollable grid

### Analytics Metrics
- Total speaking time per participant
- Engagement scores
- Message and reaction counts
- Meeting duration
- Network quality monitoring

## Browser Support
- Chrome 80+ (recommended)
- Firefox 75+
- Safari 14+
- Edge 80+

## Known Limitations
- WebRTC may require TURN server for some network configurations
- Screen sharing is browser-dependent
- Recording feature not implemented in this version

## Future Enhancements
- Breakout rooms
- Virtual backgrounds
- Live captions/transcription
- Recording capabilities
- Mobile app support

## License
MIT

## Support
For issues or questions, please create an issue in the repository.
