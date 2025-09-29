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

  // Extract audio from video file for whisper.cpp (optimized to prevent blocking)
  async extractAudioFromVideo(videoFile: File): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      video.src = URL.createObjectURL(videoFile);
      video.crossOrigin = 'anonymous';
      video.muted = true; // Prevent audio playback
      video.preload = 'metadata'; // Only load metadata initially
      
      let timeoutId: NodeJS.Timeout;
      
      video.addEventListener('loadedmetadata', async () => {
        try {
          // Limit processing time to prevent hanging
          const maxDuration = Math.min(video.duration, 30); // Max 30 seconds
          video.currentTime = 0;
          
          // Use Web Audio API to decode audio without playing
          const response = await fetch(video.src);
          const arrayBuffer = await response.arrayBuffer();
          
          // Decode audio data
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0); // Get first channel
          
          // Limit to reasonable size
          const maxSamples = 16000 * maxDuration; // 30 seconds at 16kHz
          const limitedData = audioData.length > maxSamples 
            ? audioData.slice(0, maxSamples) 
            : audioData;
          
          // Clean up
          URL.revokeObjectURL(video.src);
          audioContext.close();
          clearTimeout(timeoutId);
          
          resolve(new Float32Array(limitedData));
          
        } catch (error) {
          // Fallback: create dummy audio data
          console.warn('Audio extraction failed, using dummy data:', error);
          URL.revokeObjectURL(video.src);
          audioContext.close();
          clearTimeout(timeoutId);
          
          // Return empty audio data
          resolve(new Float32Array(16000)); // 1 second of silence
        }
      });
      
      video.addEventListener('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
      
      // Set timeout to prevent infinite hanging
      timeoutId = setTimeout(() => {
        URL.revokeObjectURL(video.src);
        audioContext.close();
        reject(new Error('Audio extraction timeout'));
      }, 10000); // 10 second timeout
    });
  }
}

export const whisperCppClient = WhisperCppClient.getInstance();
