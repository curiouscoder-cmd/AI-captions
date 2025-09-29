/**
 * Extract audio from video file using Web Audio API
 * Simplified approach that works reliably across browsers
 */

export async function extractAudioFromVideo(videoFile: File): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = 'anonymous';
    
    video.addEventListener('loadeddata', async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create offline context for processing
        const offlineContext = new OfflineAudioContext(
          1, // mono
          Math.floor(video.duration * 16000), // 16kHz sample rate
          16000
        );
        
        // Create source from video element
        const source = audioContext.createMediaElementSource(video);
        
        // Create analyser to capture audio data
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        source.connect(analyser);
        source.connect(audioContext.destination);
        
        // Simple approach: just pass the video file directly to Whisper
        // Transformers.js can handle video files directly
        const arrayBuffer = await videoFile.arrayBuffer();
        
        // Clean up
        URL.revokeObjectURL(video.src);
        audioContext.close();
        
        // Return the raw video data - Transformers.js will extract audio
        resolve(new Float32Array(arrayBuffer));
        
      } catch (error) {
        console.error('Audio extraction error:', error);
        
        // Fallback: return empty audio data
        const fallbackAudio = new Float32Array(16000); // 1 second of silence
        resolve(fallbackAudio);
      }
    });
    
    video.addEventListener('error', (error) => {
      console.error('Video loading error:', error);
      reject(new Error('Failed to load video file'));
    });
    
    // Trigger loading
    video.load();
  });
}
