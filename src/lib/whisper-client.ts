'use client';

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js to use CDN
env.allowLocalModels = false;
env.allowRemoteModels = true;

// Singleton pattern for the Whisper model
class WhisperTranscriber {
  private static instance: WhisperTranscriber;
  private pipeline: any = null;
  private isLoading = false;

  private constructor() {}

  static getInstance(): WhisperTranscriber {
    if (!WhisperTranscriber.instance) {
      WhisperTranscriber.instance = new WhisperTranscriber();
    }
    return WhisperTranscriber.instance;
  }

  async loadModel(onProgress?: (progress: string) => void) {
    if (this.pipeline) return this.pipeline;
    if (this.isLoading) {
      // Wait for ongoing loading
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.pipeline;
    }

    this.isLoading = true;
    try {
      onProgress?.('Loading Whisper model from CDN...');
      
      this.pipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en', // Much smaller model (~39MB vs ~466MB)
        {
          quantized: true, // Use quantized model for faster loading
          progress_callback: (progress: any) => {
            if (progress.status === 'progress' && progress.total) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              onProgress?.(`Downloading model (39MB): ${percent}%`);
            } else if (progress.status === 'ready') {
              onProgress?.('Model ready!');
            }
          }
        }
      );
      
      onProgress?.('Model loaded successfully!');
      return this.pipeline;
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      throw new Error('Failed to load Whisper model. Please check your internet connection.');
    } finally {
      this.isLoading = false;
    }
  }

  async transcribe(input: string | Float32Array | ArrayBuffer, onProgress?: (progress: string) => void) {
    const model = await this.loadModel(onProgress);
    
    onProgress?.('Transcribing audio...');
    
    try {
      // Use optimized settings for faster processing
      let output = await model(input, {
        return_timestamps: true,
        chunk_length_s: 15, // Smaller chunks for faster processing
        stride_length_s: 2, // Less overlap for speed
        task: 'transcribe',
        language: 'english', // Skip language detection for speed
      });

      // If no text detected, try with Hindi language specified
      if (!output.text && (!output.chunks || output.chunks.length === 0)) {
        onProgress?.('Retrying with Hindi language detection...');
        output = await model(input, {
          return_timestamps: true,
          chunk_length_s: 30,
          stride_length_s: 5,
          language: 'hindi',
          task: 'transcribe',
        });
      }

      // Format output into captions
      const captions = [];
      
      if (output.chunks && output.chunks.length > 0) {
        for (const chunk of output.chunks) {
          const start = chunk.timestamp?.[0] ?? 0;
          const end = chunk.timestamp?.[1] ?? start + 2;
          const text = chunk.text?.trim() || '';
          
          if (text) {
            captions.push({
              start: Math.round(start * 10) / 10,
              end: Math.round(end * 10) / 10,
              text
            });
          }
        }
      } else if (output.text) {
        // Single caption for entire audio
        captions.push({
          start: 0,
          end: 5,
          text: output.text.trim()
        });
      }

      return captions;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}

export const whisperTranscriber = WhisperTranscriber.getInstance();
