# Chrome Extension Installation Guide

## Quick Start

1. **Ensure Backend is Running**
   - Open terminal in `backend/` folder
   - Run: `node server.js`
   - Server should start on `http://localhost:3001`

2. **Load Extension in Chrome**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `extension/` folder
   - Extension icon should appear in toolbar

3. **Use the Extension**
   - Click the extension icon in Chrome toolbar
   - Select your role (Freelancer, Founder, etc.)
   - Paste contract text (minimum 50 characters)
   - Click "Analyze Contract"
   - View risk score and detailed analysis

## Troubleshooting

### "Failed to connect to backend"
- Make sure `node server.js` is running on port 3001
- Check backend terminal for errors
- Verify no firewall is blocking localhost:3001

### Extension not showing
- Refresh `chrome://extensions/` page
- Check for error messages in extension list
- Try removing and re-loading the extension

### Analysis not working
- Open DevTools (F12) while extension popup is open
- Check Console tab for errors
- Verify backend response in Network tab

## Features

✅ Role-based risk analysis
- ✅ AI-powered contract scanning
✅ Smart features (Worst Case, Who Benefits)
✅ ELI15 simplified explanations
✅ Beautiful gradient UI design
✅ Persistent settings (saved between sessions)

## Next Steps

To use this extension outside development:
1. Deploy backend to a cloud service (Vercel, Railway, etc.)
2. Update `shared/api.js` with production URL
3. Package extension for Chrome Web Store distribution
