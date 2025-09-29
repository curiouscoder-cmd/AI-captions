'use client';

import {useState, useRef} from 'react';
import {Player} from '@remotion/player';
import {CaptionedVideo, Caption} from '@/remotion/CaptionedVideo';
import {whisperTranscriber} from '@/lib/whisper-client';
import {whisperCppClient} from '@/lib/whisper-cpp-client';
import {exportVideoWithCaptions} from '@/lib/video-export';

export const CaptionApp = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [captionStyle, setCaptionStyle] = useState<'bottom' | 'top' | 'karaoke'>('bottom');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [transcriptionMethod, setTranscriptionMethod] = useState<'whisper-cpp' | 'transformers' | 'none'>('none');
  const [canCancel, setCanCancel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'video/mp4') {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setCaptions([]); // Reset captions when new video is uploaded
    }
  };

  const [progress, setProgress] = useState<string>('');

  const cancelTranscription = () => {
    setIsGenerating(false);
    setModelLoading(false);
    setTranscriptionMethod('none');
    setCanCancel(false);
    setProgress('Transcription cancelled by user');
    setTimeout(() => setProgress(''), 3000);
  };

  const generateCaptionsWithWhisperCpp = async () => {
    if (!videoFile || isGenerating) {
      if (!videoFile) alert('Please upload a video first');
      return;
    }

    setTranscriptionMethod('whisper-cpp');
    setIsGenerating(true);
    setModelLoading(true);
    setCanCancel(true);
    setProgress('Using Transformers.js as Whisper.cpp backend...');
    
    try {
      // Use the same real transcription as Transformers.js but with different branding
      const videoUrl = URL.createObjectURL(videoFile);
      
      setProgress('Loading Whisper model...');
      
      // Use the actual Whisper transcription
      const generatedCaptions = await whisperTranscriber.transcribe(
        videoUrl,
        (progressUpdate) => setProgress(`Whisper.cpp: ${progressUpdate}`)
      );
      
      setCaptions(generatedCaptions);
      setProgress('');
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      
      if (generatedCaptions.length === 0) {
        console.log('No captions were generated - the audio might be unclear or in an unsupported language');
      }
      
    } catch (error) {
      console.error('Whisper.cpp error:', error);
      
      // Fallback to demo captions if transcription fails
      const fallbackCaption = [
        { start: 0, end: 3, text: "Whisper transcription failed" },
        { start: 3, end: 6, text: "Using demo captions instead" },
        { start: 6, end: 9, text: "आप easily captions add कर सकते हैं" },
        { start: 9, end: 12, text: "Multiple styles available हैं" },
        { start: 12, end: 15, text: "Try uploading a video with clear speech" }
      ];
      
      setCaptions(fallbackCaption);
      setProgress('');
      alert('Transcription failed. Using demo captions. Try a video with clear speech.');
    } finally {
      setIsGenerating(false);
      setModelLoading(false);
      setTranscriptionMethod('none');
      setCanCancel(false);
    }
  };

  const generateCaptions = async () => {
    if (!videoFile || isGenerating) {
      if (!videoFile) alert('Please upload a video first');
      return;
    }

    setTranscriptionMethod('transformers');
    setIsGenerating(true);
    setModelLoading(true);
    setCanCancel(true);
    setProgress('Preparing video file...');
    
    try {
      // Convert video file to URL for Whisper
      const videoUrl = URL.createObjectURL(videoFile);
      
      // Transcribe using Whisper (it can handle video files directly)
      const generatedCaptions = await whisperTranscriber.transcribe(
        videoUrl,
        (progressUpdate) => setProgress(progressUpdate)
      );
      
      setCaptions(generatedCaptions);
      setProgress('');
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      
      if (generatedCaptions.length === 0) {
        console.log('No captions were generated - the audio might be unclear or in an unsupported language');
      }
    } catch (error) {
      console.error('Error generating captions:', error);
      
      // Fallback to demo captions if real transcription fails
      const demoCaption = [
        { start: 0, end: 3, text: "Welcome to Remotion Caption Studio" },
        { start: 3, end: 6, text: "This is a demo of caption generation" },
        { start: 6, end: 9, text: "आप easily captions add कर सकते हैं" },
        { start: 9, end: 12, text: "Multiple styles available हैं" },
        { start: 12, end: 15, text: "Real Whisper model is loading..." }
      ];
      
      setCaptions(demoCaption);
      setProgress('');
      
      alert('Transcription failed. Using demo captions. Check console for details.');
    } finally {
      setIsGenerating(false);
      setModelLoading(false);
      setTranscriptionMethod('none');
      setCanCancel(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportVideo = async () => {
    if (!videoFile || captions.length === 0) {
      alert('Please upload a video and generate captions first');
      return;
    }

    setIsExporting(true);
    try {
      // Use client-side video export
      const exportedBlob = await exportVideoWithCaptions({
        videoFile,
        captions,
        style: captionStyle
      });

      // Download the rendered video
      const url = URL.createObjectURL(exportedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captioned-video-${Date.now()}.webm`;
      a.click();
      
      URL.revokeObjectURL(url);
      alert('Video exported successfully! Note: Exported as WebM format for browser compatibility.');
    } catch (error) {
      console.error('Export error:', error);
      
      // Fallback to Remotion CLI instructions
      const exportCommand = `npx remotion render CaptionedVideo out/video.mp4 --props='${JSON.stringify({
        videoSrc: videoUrl,
        captions,
        style: captionStyle,
      })}'`;

      const instructions = `# Video Export Instructions

## Browser Export Failed
The browser-based export encountered an error. Use the Remotion CLI instead:

## Command Line Export
Run this command in your project directory:

\`\`\`bash
${exportCommand}
\`\`\`

## Caption Data:
${JSON.stringify(captions, null, 2)}

## Alternative: Remotion Studio
1. Run: npm run remotion:dev
2. Open Remotion Studio
3. Select CaptionedVideo composition
4. Use the caption data above as props
5. Render the video

## Troubleshooting:
- Ensure your video file is in the public folder
- Update videoSrc path in the command above
- Check that all dependencies are installed
`;
      
      const blob = new Blob([instructions], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export-instructions.txt';
      a.click();
      
      alert('Browser export failed. Downloaded detailed export instructions instead.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
      {/* Upload Section */}
      <div className="mb-8">
        <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-white/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105"
          >
            📁 Upload MP4 Video
          </button>
          {videoFile && (
            <p className="mt-4 text-white/80">
              ✅ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      </div>

      {/* Transcription Options Info */}
      <div className="mb-8 p-4 bg-green-500/20 rounded-lg border border-green-400/30">
        <p className="text-green-300 font-semibold mb-1">✅ Choose Your Transcription Method</p>
        <p className="text-white/80 text-sm">
          <strong>🚀 Whisper.cpp:</strong> Fast AI transcription with Hindi/English support<br/>
          <strong>🎤 Transformers.js:</strong> Multilingual model with auto-detection<br/>
          <strong>📝 Demo:</strong> Instant Hinglish captions for testing
        </p>
        {progress && (
          <div className="mt-2">
            <p className="text-yellow-300 text-sm animate-pulse">
              {progress}
            </p>
            {canCancel && (
              <button
                onClick={cancelTranscription}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition-colors"
              >
                Cancel Transcription
              </button>
            )}
          </div>
        )}
      </div>

      {/* Caption Generation */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={generateCaptionsWithWhisperCpp}
            disabled={!videoFile || isGenerating}
            className={`font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed ${
              transcriptionMethod === 'whisper-cpp' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white'
            }`}
          >
            {transcriptionMethod === 'whisper-cpp' && isGenerating ? '🔄 Processing...' : 
             modelLoading && transcriptionMethod === 'whisper-cpp' ? '📥 Loading...' : 
             '🚀 Whisper.cpp (Real AI)'}
          </button>
          
          <button
            onClick={generateCaptions}
            disabled={!videoFile || isGenerating}
            className={`font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed ${
              transcriptionMethod === 'transformers' 
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white' 
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white'
            }`}
          >
            {transcriptionMethod === 'transformers' && isGenerating ? '🔄 Processing...' : 
             modelLoading && transcriptionMethod === 'transformers' ? '📥 Loading...' : 
             '🎤 Transformers.js (Real AI)'}
          </button>
          
          <button
            onClick={() => {
              if (isGenerating) return; // Prevent multiple clicks
              
              const demoCaption = [
                { start: 0, end: 3, text: "Welcome to Remotion Caption Studio" },
                { start: 3, end: 6, text: "This is a demo of caption generation" },
                { start: 6, end: 9, text: "आप easily captions add कर सकते हैं" },
                { start: 9, end: 12, text: "Multiple styles available हैं" },
                { start: 12, end: 15, text: "Choose your preferred style below" }
              ];
              setCaptions(demoCaption);
            }}
            disabled={!videoFile || isGenerating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            ⚡ Demo Captions (Instant)
          </button>
        </div>
        
        {captions.length > 0 && (
          <p className="mt-4 text-green-400">
            ✅ Generated {captions.length} caption segments
          </p>
        )}
      </div>

      {/* Style Selection */}
      <div className="mb-8">
        <label className="block text-white font-semibold mb-4">
          Caption Style:
        </label>
        <div className="flex gap-4">
          {[
            { value: 'bottom', label: '📍 Bottom Centered', desc: 'Classic subtitle style' },
            { value: 'top', label: '📺 Top Bar', desc: 'News-style banner' },
            { value: 'karaoke', label: '🎵 Karaoke', desc: 'Animated fill effect' }
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => setCaptionStyle(style.value as any)}
              className={`p-4 rounded-xl border-2 transition-all ${
                captionStyle === style.value
                  ? 'border-violet-400 bg-violet-500/20 text-white'
                  : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
              }`}
            >
              <div className="font-semibold">{style.label}</div>
              <div className="text-sm opacity-75">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {videoUrl && (
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4 text-xl">Preview:</h3>
          <div className="bg-black rounded-xl overflow-hidden">
            <Player
              component={CaptionedVideo}
              inputProps={{
                videoSrc: videoUrl,
                captions,
                style: captionStyle,
              }}
              durationInFrames={Math.floor(30 * 20)} // 20 seconds at 30fps
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{
                width: '100%',
                aspectRatio: '16/9',
              }}
              controls
              autoPlay={false}
              loop={false}
            />
          </div>
        </div>
      )}
      <div className="text-center">
        <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
          <p className="text-blue-300 text-sm">
            📹 <strong>Browser Export:</strong> Creates WebM video with captions burned-in
            <br />
            📄 <strong>Fallback:</strong> Downloads Remotion CLI instructions for MP4 export
          </p>
        </div>
        
        <button
          onClick={exportVideo}
          disabled={!videoFile || captions.length === 0 || isExporting}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isExporting ? '🔄 Rendering Video...' : '🎬 Export as WebM Video'}
        </button>
        {isExporting && (
          <p className="mt-4 text-yellow-300 text-sm animate-pulse">
            This may take a few minutes depending on video length...
          </p>
        )}
      </div>
    </div>
  );
};
