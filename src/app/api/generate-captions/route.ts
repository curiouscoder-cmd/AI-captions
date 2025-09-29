import {NextRequest, NextResponse} from 'next/server';
import {pipeline} from '@xenova/transformers';

// Cache the pipeline to avoid reloading
let whisperPipeline: any = null;

async function getWhisperPipeline() {
  if (!whisperPipeline) {
    console.log('Loading Whisper model for the first time...');
    // Using whisper-tiny for faster processing
    // You can also use 'Xenova/whisper-small' for better accuracy
    whisperPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',
      {
        revision: 'main',
        quantized: true, // Use quantized model for faster loading
      }
    );
  }
  return whisperPipeline;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        {error: 'Video file is required'},
        {status: 400}
      );
    }

    console.log('Processing video:', videoFile.name);

    // Convert video file to ArrayBuffer
    const arrayBuffer = await videoFile.arrayBuffer();
    
    // Get the Whisper pipeline
    const transcriber = await getWhisperPipeline();
    
    console.log('Transcribing audio with Whisper...');
    
    // Transcribe with timestamps
    const output = await transcriber(arrayBuffer, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
    });

    // Format the output into caption segments
    const captions = [];
    
    if (output.chunks && output.chunks.length > 0) {
      for (const chunk of output.chunks) {
        const start = chunk.timestamp[0] ?? 0;
        const end = chunk.timestamp[1] ?? start + 2;
        const text = chunk.text?.trim() || '';
        
        if (text) {
          captions.push({
            start: Math.round(start * 10) / 10,
            end: Math.round(end * 10) / 10,
            text: text
          });
        }
      }
    } else if (output.text) {
      // Fallback: single caption for entire video
      captions.push({
        start: 0,
        end: 5,
        text: output.text.trim()
      });
    }

    console.log(`Generated ${captions.length} captions`);
    
    return NextResponse.json({
      captions,
      model: 'whisper-tiny.en',
      note: 'Real transcription using Whisper AI model'
    });
  } catch (error) {
    console.error('Error generating captions:', error);
    
    // Fallback to basic captions if model fails
    const fallbackCaptions = [
      { start: 0, end: 3, text: "Transcription is processing..." },
      { start: 3, end: 6, text: "Please ensure your video has clear audio" },
      { start: 6, end: 9, text: "The model may need to download on first use" }
    ];
    
    return NextResponse.json({
      captions: fallbackCaptions,
      error: 'Model loading failed - using fallback captions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
