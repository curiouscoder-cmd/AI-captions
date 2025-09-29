'use client';

import { Caption } from '@/remotion/CaptionedVideo';

export class ApiTranscriber {
  static async transcribe(
    videoFile: File,
    onProgress?: (progress: string) => void
  ): Promise<Caption[]> {
    try {
      onProgress?.('Uploading video to server...');
      
      const formData = new FormData();
      formData.append('video', videoFile);
      
      onProgress?.('Processing on server (faster)...');
      
      const response = await fetch('/api/generate-captions', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('API error:', data.error);
        throw new Error(data.error);
      }
      
      onProgress?.('Captions generated successfully!');
      
      return data.captions || [];
    } catch (error) {
      console.error('API transcription failed:', error);
      throw error;
    }
  }
}
