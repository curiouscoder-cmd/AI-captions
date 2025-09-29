// Simple mock transcription for demo purposes
// In production, you would use actual Whisper model

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

// Mock captions for demo - simulates what Whisper would return
const DEMO_CAPTIONS: TranscriptionSegment[] = [
  { start: 0, end: 2, text: "Welcome to our video demonstration" },
  { start: 2, end: 4, text: "This is Remotion Caption Studio" },
  { start: 4, end: 6, text: "आप easily captions add कर सकते हैं" },
  { start: 6, end: 8, text: "Multiple styles available हैं" },
  { start: 8, end: 10, text: "Choose from three different presets" },
  { start: 10, end: 12, text: "Bottom centered for classic subtitles" },
  { start: 12, end: 14, text: "Top bar for news style" },
  { start: 14, end: 16, text: "या फिर karaoke effect के लिए" },
  { start: 16, end: 18, text: "Export your video with captions" },
  { start: 18, end: 20, text: "Thank you for watching!" }
];

export async function transcribeVideo(videoFile: File): Promise<TranscriptionSegment[]> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get video duration (approximate)
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      
      // Return demo captions scaled to video duration
      const scaledCaptions = DEMO_CAPTIONS.map((caption, index) => {
        const segmentDuration = duration / DEMO_CAPTIONS.length;
        return {
          start: index * segmentDuration,
          end: (index + 1) * segmentDuration,
          text: caption.text
        };
      });
      
      resolve(scaledCaptions);
    };
    
    // Fallback if metadata doesn't load
    setTimeout(() => {
      resolve(DEMO_CAPTIONS);
    }, 1000);
  });
}

// For actual Whisper implementation, you would:
// 1. Extract audio from video using Web Audio API
// 2. Convert to appropriate format
// 3. Run through Whisper model (via WASM or server)
// 4. Return actual transcription with timestamps
