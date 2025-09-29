'use client';

import { Caption } from '@/remotion/CaptionedVideo';

export interface ExportOptions {
  videoFile: File;
  captions: Caption[];
  style: 'bottom' | 'top' | 'karaoke';
}

export async function exportVideoWithCaptions(options: ExportOptions): Promise<Blob> {
  const { videoFile, captions, style } = options;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.src = URL.createObjectURL(videoFile);
    video.muted = false; // Keep audio for export
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const chunks: Blob[] = [];
      
      // Get canvas stream for video
      const canvasStream = canvas.captureStream(30); // 30 FPS
      let finalStream = canvasStream;
      
      try {
        // Try to extract and combine audio
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination); // Also play audio
        
        // Combine video and audio streams
        finalStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...destination.stream.getAudioTracks()
        ]);
      } catch (error) {
        console.warn('Audio extraction failed, exporting video only:', error);
        // fallback to video-only stream
      }
      
      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        URL.revokeObjectURL(video.src);
        resolve(blob);
      };
      
      // Start recording
      mediaRecorder.start();
      
      const renderFrame = () => {
        if (video.ended || video.paused) {
          mediaRecorder.stop();
          return;
        }
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Find current caption
        const currentTime = video.currentTime;
        const currentCaption = captions.find(
          caption => currentTime >= caption.start && currentTime <= caption.end
        );
        
        // Draw caption if exists
        if (currentCaption) {
          drawCaption(ctx, currentCaption.text, style, canvas.width, canvas.height);
        }
        
        requestAnimationFrame(renderFrame);
      };
      
      // Start video playback and rendering
      video.play();
      renderFrame();
      
      // Stop after video ends or 2 minutes max
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          video.pause();
        }
      }, Math.min(video.duration * 1000, 120000));
    });
    
    video.addEventListener('error', reject);
  });
}

function drawCaption(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  style: 'bottom' | 'top' | 'karaoke',
  width: number,
  height: number
) {
  const fontSize = Math.max(24, width / 40);
  ctx.font = `bold ${fontSize}px "Noto Sans", "Noto Sans Devanagari", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Text metrics
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;
  
  let x = width / 2;
  let y: number;
  
  switch (style) {
    case 'bottom':
      y = height - height * 0.12; // Move captions higher to avoid cropping
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(
        x - textWidth / 2 - 20,
        y - textHeight / 2 - 10,
        textWidth + 40,
        textHeight + 20
      );
      
      // Text
      ctx.fillStyle = 'white';
      ctx.fillText(text, x, y);
      break;
      
    case 'top':
      y = height * 0.15;
      
      // Background bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, y - textHeight / 2 - 15, width, textHeight + 30);
      
      // Accent line
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(0, y + textHeight / 2 + 5, width, 4);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.fillText(text, x, y);
      break;
      
    case 'karaoke':
      y = height - height * 0.15; // Move captions higher to avoid cropping
      
      // Text shadow/outline
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(text, x, y);
      
      // Main text with gradient effect
      const gradient = ctx.createLinearGradient(x - textWidth/2, y, x + textWidth/2, y);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#ffd93d');
      gradient.addColorStop(1, '#6bcf7f');
      
      ctx.fillStyle = gradient;
      ctx.fillText(text, x, y);
      break;
  }
}
