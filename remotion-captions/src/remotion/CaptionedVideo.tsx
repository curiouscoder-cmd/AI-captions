import React from 'react';
import {Video, useCurrentFrame, useVideoConfig} from 'remotion';
import {CaptionRenderer} from './CaptionRenderer';

export interface Caption {
  start: number;
  end: number;
  text: string;
}

export interface CaptionedVideoProps {
  videoSrc: string;
  captions: Caption[];
  style: 'bottom' | 'top' | 'karaoke';
}

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
  videoSrc,
  captions,
  style
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const currentTime = frame / fps;

  // Find current caption
  const currentCaption = captions.find(
    caption => currentTime >= caption.start && currentTime <= caption.end
  );

  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      {videoSrc && (
        <Video
          src={videoSrc}
          style={{width: '100%', height: '100%'}}
        />
      )}
      
      {currentCaption && (
        <CaptionRenderer
          text={currentCaption.text}
          style={style}
          currentTime={currentTime}
          captionStart={currentCaption.start}
          captionEnd={currentCaption.end}
        />
      )}
    </div>
  );
};
