'use client';

import { Caption } from '@/remotion/CaptionedVideo';

// Whisper.cpp WASM integration
class WhisperCppClient {
  private static instance: WhisperCppClient;
  private whisperModule: any = null;
  private isLoading = false;

  private constructor() {}

  static getInstance(): WhisperCppClient {
    if (!WhisperCppClient.instance) {
      WhisperCppClient.instance = new WhisperCppClient();
    }
    return WhisperCppClient.instance;
  }

  async loadWhisperCpp(onProgress?: (progress: string) => void): Promise<any> {
    if (this.whisperModule) return this.whisperModule;
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.whisperModule;
    }

    this.isLoading = true;
    try {
      onProgress?.('Loading Whisper.cpp WASM module...');
      
      // Dynamic import of whisper-wasm
      const { default: createWhisperModule } = await import('whisper-wasm');
      
      onProgress?.('Initializing Whisper.cpp...');
      this.whisperModule = await createWhisperModule();
      
      onProgress?.('Whisper.cpp loaded successfully!');
      return this.whisperModule;
    } catch (error) {
      console.error('Failed to load Whisper.cpp:', error);
      throw new Error('Failed to load Whisper.cpp WASM module');
    } finally {
      this.isLoading = false;
    }
  }

  async transcribeAudio(
    audioData: Float32Array | ArrayBuffer,
    onProgress?: (progress: string) => void
  ): Promise<Caption[]> {
    try {
      const whisper = await this.loadWhisperCpp(onProgress);
      
      onProgress?.('Processing audio with Whisper.cpp...');
      
      // Convert audio data to the format expected by whisper.cpp
      let audioFloat32: Float32Array;
      if (audioData instanceof ArrayBuffer) {
        audioFloat32 = new Float32Array(audioData);
      } else {
        audioFloat32 = audioData;
      }
      
      // Transcribe with whisper.cpp
      const result = await whisper.transcribe(audioFloat32, {
        language: 'auto',
        translate: false,
        timestamps: true,
        max_len: 0,
        split_on_word: true
      });
      
      // Convert whisper.cpp result to our caption format
      const captions: Caption[] = [];
      
      if (result.segments) {
        for (const segment of result.segments) {
          captions.push({
            start: segment.start || 0,
            end: segment.end || segment.start + 2,
            text: segment.text?.trim() || ''
          });
        }
      } else if (result.text) {
        // Fallback: single caption
        captions.push({
          start: 0,
          end: 5,
          text: result.text.trim()
        });
      }
      
      return captions;
    } catch (error) {
      console.error('Whisper.cpp transcription error:', error);
      throw error;
    }
  }

  // Extract audio from video file for whisper.cpp
  async extractAudioFromVideo(videoFile: File): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      video.src = URL.createObjectURL(videoFile);
      video.crossOrigin = 'anonymous';
      
      video.addEventListener('loadeddata', async () => {
        try {
          // Create audio source from video
          const source = audioContext.createMediaElementSource(video);
          const analyser = audioContext.createAnalyser();
          
          source.connect(analyser);
          source.connect(audioContext.destination);
          
          // Get audio buffer
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Float32Array(bufferLength);
          
          // Play video to capture audio
          video.play();
          
          // Capture audio data
          const captureAudio = () => {
            analyser.getFloatFrequencyData(dataArray);
            
            if (!video.ended) {
              requestAnimationFrame(captureAudio);
            } else {
              // Clean up
              URL.revokeObjectURL(video.src);
              audioContext.close();
              resolve(dataArray);
            }
          };
          
          captureAudio();
          
        } catch (error) {
          reject(error);
        }
      });
      
      video.addEventListener('error', reject);
    });
  }
}

export const whisperCppClient = WhisperCppClient.getInstance();
