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
      
      onProgress?.('Downloading Whisper model (tiny.en ~39MB)...');
      // Use smaller model for faster loading
      this.whisperModule = await createWhisperModule({
        model: 'tiny.en', // Much smaller model (~39MB vs ~1.5GB for medium)
        // Add progress callback if supported
        onProgress: (progress: number) => {
          onProgress?.(`Downloading model: ${Math.round(progress * 100)}%`);
        }
      });
      
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
    // Add timeout to prevent indefinite hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Transcription timeout after 2 minutes. Try a shorter video or use Transformers.js instead.'));
      }, 120000); // 2 minute timeout
    });

    try {
      return await Promise.race([
        this.performTranscription(audioData, onProgress),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Whisper.cpp transcription failed:', error);
      throw error;
    }
  }

  private async performTranscription(
    audioData: Float32Array | ArrayBuffer,
    onProgress?: (progress: string) => void
  ): Promise<Caption[]> {
    const whisper = await this.loadWhisperCpp(onProgress);
    
    onProgress?.('Processing audio with Whisper.cpp...');
    
    // Convert audio data to the format expected by whisper.cpp
    let audioFloat32: Float32Array;
    if (audioData instanceof ArrayBuffer) {
      audioFloat32 = new Float32Array(audioData);
    } else {
      audioFloat32 = audioData;
    }
    
    // Limit audio length to prevent hanging (max 60 seconds)
    const maxSamples = 16000 * 60; // 60 seconds at 16kHz
    if (audioFloat32.length > maxSamples) {
      onProgress?.('Audio too long, processing first 60 seconds...');
      audioFloat32 = audioFloat32.slice(0, maxSamples);
    }
    
    // Transcribe with whisper.cpp - first try auto-detection
    let result = await whisper.transcribe(audioFloat32, {
      language: 'auto',
      translate: false,
      timestamps: true,
      max_len: 0,
      split_on_word: true
    });

    // If no text detected, try with Hindi language specified
    if (!result.text && (!result.segments || result.segments.length === 0)) {
      onProgress?.('Retrying with Hindi language detection...');
      result = await whisper.transcribe(audioFloat32, {
        language: 'hi', // Hindi language code
        translate: false,
        timestamps: true,
        max_len: 0,
        split_on_word: true
      });
    }
    
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
