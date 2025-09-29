import {NextRequest, NextResponse} from 'next/server';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import {tmpdir} from 'os';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const captionsStr = formData.get('captions') as string;
    const style = formData.get('style') as string;

    if (!videoFile || !captionsStr || !style) {
      return NextResponse.json(
        {error: 'Video file, captions, and style are required'},
        {status: 400}
      );
    }

    const captions = JSON.parse(captionsStr);
    
    // Save video file temporarily
    const tempDir = tmpdir();
    const videoPath = path.join(tempDir, `input-${Date.now()}.mp4`);
    const inputVideoBuffer = Buffer.from(await videoFile.arrayBuffer());
    fs.writeFileSync(videoPath, inputVideoBuffer);

    // Create output path
    const outputPath = path.join(tempDir, `captioned-video-${Date.now()}.mp4`);

    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src/remotion/Root.tsx'),
      // Add webpack override if needed
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'CaptionedVideo',
      inputProps: {
        videoSrc: videoPath,
        captions,
        style,
      },
    });

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        videoSrc: videoPath,
        captions,
        style,
      },
    });

    // Read the rendered video file
    const outputVideoBuffer = fs.readFileSync(outputPath);

    // Clean up temporary files
    fs.unlinkSync(videoPath);
    fs.unlinkSync(outputPath);

    // Return the video file
    return new NextResponse(outputVideoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="captioned-video.mp4"',
      },
    });
  } catch (error) {
    console.error('Error exporting video:', error);
    
    // Clean up any temporary files on error
    try {
      const tempFiles = fs.readdirSync(tmpdir()).filter(f => f.includes('input-') || f.includes('captioned-video-'));
      tempFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(tmpdir(), file));
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return NextResponse.json(
      {error: 'Failed to export video. This feature requires server-side rendering setup.'},
      {status: 500}
    );
  }
}
