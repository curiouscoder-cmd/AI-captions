# 🎥 Demo Instructions for Remotion Caption Studio

## Quick Demo Steps

### 1. Start the Application
```bash
npm run dev
```
Open http://localhost:3000

### 2. Test the Application

#### Option A: Use a Sample Video
- Download any short MP4 video (10-30 seconds recommended)
- Good test videos: 
  - News clips
  - Tutorial videos
  - Speech/presentation clips
  - Hinglish content for testing mixed language support

#### Option B: Create a Test Video
Use QuickTime or any screen recorder to create a short video with speech.

### 3. Generate Captions

1. **Upload Video**: Click "Upload MP4 Video" button
2. **API Key**: Enter your OpenAI API key
   - Get one from: https://platform.openai.com/api-keys
   - Format: `sk-...`
3. **Generate**: Click "Auto-generate Captions"
4. **Wait**: Processing takes 10-30 seconds depending on video length

### 4. Preview Different Styles

Try all three caption presets:
- **Bottom Centered**: Traditional subtitle look
- **Top Bar**: News channel style
- **Karaoke**: Animated text fill

### 5. Export Video

Click "Export Captioned Video" to get:
- Export instructions file
- Command to render final video
- Caption data JSON

### 6. Manual Render (Optional)

For actual video export, run:
```bash
npx remotion render CaptionedVideo out/demo.mp4 --props='{"videoSrc":"[VIDEO_PATH]","captions":[CAPTION_DATA],"style":"bottom"}'
```

## 🎯 Key Features to Showcase

1. **Automatic Speech Recognition**: Powered by OpenAI Whisper
2. **Multiple Styles**: 3 different caption presets
3. **Hinglish Support**: Handles Hindi + English mixed text
4. **Real-time Preview**: Instant preview with Remotion Player
5. **Beautiful UI**: Modern gradient design with smooth animations

## 📝 Sample Captions Data

If you want to test without API key, use this sample data:
```json
[
  {"start": 0, "end": 2, "text": "नमस्ते, Welcome to our demo"},
  {"start": 2, "end": 4, "text": "This is Remotion Caption Studio"},
  {"start": 4, "end": 6, "text": "आप easily captions add कर सकते हैं"},
  {"start": 6, "end": 8, "text": "Multiple styles available हैं"}
]
```

## 🚀 Performance Tips

- Use videos under 2 minutes for best performance
- MP4 format with H.264 codec works best
- Clear audio gives better caption accuracy
- Internet connection needed for:
  - Google Fonts loading
  - OpenAI API calls

## 🎨 Customization

To modify caption styles, edit:
- `/src/remotion/CaptionRenderer.tsx` for styling
- `/src/components/CaptionApp.tsx` for UI changes

## ⚡ Quick Fixes

### If captions don't generate:
1. Check API key is valid
2. Ensure video has audio
3. Check console for errors

### If preview doesn't load:
1. Refresh the page
2. Re-upload the video
3. Check video format is MP4

## 📦 Deliverables Checklist

✅ Full source code with all components
✅ README with setup instructions  
✅ Support for Hinglish captions
✅ 3 caption style presets
✅ Local preview functionality
✅ Export instructions
✅ Clean, modern UI

## 🎉 Success Metrics

The demo is successful if:
- Video uploads work smoothly
- Captions generate accurately
- All 3 styles display correctly
- Hinglish text renders properly
- Export instructions are clear

---

**Time to Complete**: 4-5 hours
**Difficulty**: Intermediate
**Technologies**: Next.js, Remotion, OpenAI, TypeScript
