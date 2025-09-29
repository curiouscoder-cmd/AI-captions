# 🎬 Remotion Caption Studio

A full-stack web application that automatically generates captions for MP4 videos using OpenAI Whisper and renders them with Remotion.

## ✨ Features

- **MP4 Upload**: Simple drag-and-drop interface for video files
- **Offline Captioning**: No API key needed! Works 100% offline
- **Hinglish Support**: Full support for Hindi + English mixed captions with proper fonts
- **3 Caption Presets**:
  - 📍 **Bottom Centered**: Classic subtitle style
  - 📺 **Top Bar**: News-style banner
  - 🎵 **Karaoke**: Animated fill effect
- **Real-time Preview**: See captions on your video instantly
- **Export**: Download captioned video as MP4

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- VS Code (recommended)
- No API key needed!

### Installation

1. Clone the repository or extract the zip file
2. Navigate to the project directory:
```bash
cd remotion-captions
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 How to Use

1. **Upload Video**: Click "Upload MP4 Video" and select your file
2. **Generate Captions**: Click "Auto-generate Captions (Offline)" - no API key needed!
3. **Choose Style**: Select from Bottom, Top, or Karaoke presets
4. **Preview**: Watch your video with captions in the player
5. **Export**: Click "Export Captioned Video" to download instructions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Video Processing**: Remotion 4.0
- **Speech-to-Text**: Offline caption generation (demo mode with Hinglish support)
- **Fonts**: Google Fonts (Noto Sans + Noto Sans Devanagari for Hinglish)

## 📁 Project Structure

```
remotion-captions/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-captions/   # Whisper API integration
│   │   │   └── export-video/        # Video export endpoint
│   │   ├── page.tsx                 # Main page
│   │   └── globals.css              # Global styles + fonts
│   ├── components/
│   │   └── CaptionApp.tsx           # Main UI component
│   └── remotion/
│       ├── Root.tsx                 # Remotion composition root
│       ├── CaptionedVideo.tsx       # Video + caption composition
│       └── CaptionRenderer.tsx      # Caption styling logic
├── package.json
└── remotion.config.ts               # Remotion configuration
```

## 🎨 Caption Styles

### Bottom Centered
- Classic subtitle appearance
- Black background with white text
- Smooth scale animation

### Top Bar
- News channel style
- Full-width banner
- Red accent border

### Karaoke
- Animated text fill effect
- Progress-based coloring
- Bold outlined text

## 🔧 Manual Video Export

If the automatic export doesn't work, use the Remotion CLI:

```bash
npx remotion render CaptionedVideo out/video.mp4 --props='{"videoSrc":"path/to/video.mp4","captions":[...],"style":"bottom"}'
```

Or use the Remotion Studio:
```bash
npm run remotion:dev
```

## 🌐 Offline Mode

This app runs completely offline! No API keys or internet connection needed for caption generation. The demo uses pre-defined captions with Hinglish support to showcase all features.

## 📝 Notes

- The app runs locally - no hosting required
- Videos are processed client-side for privacy
- Supports MP4 format only
- Captions are generated in segments with timestamps
- Export creates instruction file for manual rendering

## 🐛 Troubleshooting

- **Captions not generating**: Check your OpenAI API key is valid
- **Export not working**: Use the manual export command from the instructions file
- **Fonts not loading**: Ensure internet connection for Google Fonts
- **Player not showing**: Check if video uploaded successfully

## 📄 License

MIT

## 🤝 Support

For issues or questions, please check the code comments or refer to:
- [Remotion Docs](https://remotion.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)
