# Extension Setup (No Icons Yet)

Since the image generation is currently unavailable, you have two options for icons:

## Option 1: Use Temporary Placeholder Icons

Create simple colored square PNG files (16x16, 48x48, 128x128) with purple/violet gradient:
- Save them as `icon16.png`, `icon48.png`, `icon128.png` in `extension/assets/` folder
- You can use any image tool (Paint, Photoshop, online tools)
- Or use this online tool: https://redketchup.io/icon-editor

## Option 2: Use Extension Without Icons (Quick Test)

You can test the extension without icons:
1. Comment out the "icons" sections in `manifest.json`
2. The extension will work but show a default Chrome icon

## Recommended: Option 2 for now

Edit `extension/manifest.json` and comment out these sections:

```json
{
  "manifest_version": 3,
  "name": "AI Contract Risk Scanner",
  "version": "1.0.0",
  "description": "Analyze contracts for legal risks with AI-powered insights. Detect risky clauses and get personalized recommendations.",
  "permissions": ["storage"],
  "host_permissions": ["http://localhost:3001/*"],
  "action": {
    "default_popup": "popup/popup.html"
    // "default_icon": {
    //   "16": "assets/icon16.png",
    //   "48": "assets/icon48.png",
    //   "128": "assets/icon128.png"
    // }
  }
  // "icons": {
  //   "16": "assets/icon16.png",
  //   "48": "assets/icon48.png",
  //   "128": "assets/icon128.png"
  // }
}
```

This will let you test immediately!
