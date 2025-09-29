import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

interface CaptionRendererProps {
  text: string;
  style: 'bottom' | 'top' | 'karaoke';
  currentTime: number;
  captionStart: number;
  captionEnd: number;
}

export const CaptionRenderer: React.FC<CaptionRendererProps> = ({
  text,
  style,
  currentTime,
  captionStart,
  captionEnd
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  // Animation for caption entrance
  const progress = interpolate(
    currentTime,
    [captionStart, captionStart + 0.3],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  const scale = spring({
    frame: frame - (captionStart * fps),
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
  });

  // Karaoke effect progress
  const karaokeProg = interpolate(
    currentTime,
    [captionStart, captionEnd],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  const getStyleConfig = () => {
    switch (style) {
      case 'bottom':
        return {
          position: 'absolute' as const,
          bottom: '10%',
          left: '50%',
          transform: `translateX(-50%) scale(${scale})`,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '16px 32px',
          borderRadius: '8px',
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center' as const,
          maxWidth: '80%',
          fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
          lineHeight: 1.2,
        };
      
      case 'top':
        return {
          position: 'absolute' as const,
          top: '10%',
          left: '0',
          right: '0',
          transform: `scale(${scale})`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          fontSize: '42px',
          fontWeight: 'bold',
          textAlign: 'center' as const,
          fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
          borderBottom: '4px solid #ff6b6b',
        };
      
      case 'karaoke':
        return {
          position: 'absolute' as const,
          bottom: '15%',
          left: '50%',
          transform: `translateX(-50%) scale(${scale})`,
          fontSize: '52px',
          fontWeight: 'bold',
          textAlign: 'center' as const,
          fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
          textShadow: '3px 3px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
        };
      
      default:
        return {};
    }
  };

  // Special rendering for karaoke effect
  if (style === 'karaoke') {
    const baseStyle = getStyleConfig();
    return (
      <div style={{...baseStyle, opacity: progress}}>
        {/* Background text (unfilled) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          color: 'rgba(255, 255, 255, 0.6)',
          zIndex: 1,
          fontSize: 'inherit',
          fontWeight: 'inherit',
          fontFamily: 'inherit',
          textAlign: 'inherit',
          textShadow: 'inherit',
        }}>
          {text}
        </div>
        
        {/* Filled text (progresses with karaoke) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${karaokeProg * 100}%`,
          height: '100%',
          overflow: 'hidden',
          color: '#ffdd44',
          zIndex: 2,
          fontSize: 'inherit',
          fontWeight: 'inherit',
          fontFamily: 'inherit',
          textAlign: 'inherit',
          textShadow: '3px 3px 0px #ff6b6b, -1px -1px 0px #ff6b6b, 1px -1px 0px #ff6b6b, -1px 1px 0px #ff6b6b',
        }}>
          {text}
        </div>
      </div>
    );
  }

  return (
    <div style={{...getStyleConfig(), opacity: progress}}>
      {text}
    </div>
  );
};
