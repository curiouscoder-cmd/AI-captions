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
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '36px',
          fontWeight: 'bold',
          textAlign: 'center' as const,
          maxWidth: '90%',
          fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
          lineHeight: 1.3,
          wordWrap: 'break-word' as const,
          overflowWrap: 'break-word' as const,
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
          padding: '16px',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center' as const,
          fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
          borderBottom: '4px solid #ff6b6b',
          wordWrap: 'break-word' as const,
          overflowWrap: 'break-word' as const,
        };
      
      case 'karaoke':
        return {
          position: 'absolute' as const,
          bottom: '15%',
          left: '50%',
          transform: `translateX(-50%) scale(${scale})`,
          fontSize: '38px',
          fontWeight: 'bold',
          textAlign: 'center' as const,
          fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
          textShadow: '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
          maxWidth: '90%',
          wordWrap: 'break-word' as const,
          overflowWrap: 'break-word' as const,
        };
      
      default:
        return {};
    }
  };

  // Special rendering for karaoke effect
  if (style === 'karaoke') {
    const baseStyle = getStyleConfig();
    
    // Calculate how many characters should be highlighted
    const totalChars = text.length;
    const highlightedChars = Math.floor(karaokeProg * totalChars);
    
    return (
      <div
        style={{
          ...baseStyle,
          opacity: progress,
        }}
      >
        {text.split('').map((char, index) => (
          <span
            key={index}
            style={{
              color: index < highlightedChars ? '#ffdd44' : 'rgba(255, 255, 255, 0.8)',
              textShadow: index < highlightedChars 
                ? '2px 2px 0px #ff6b6b, -1px -1px 0px #ff6b6b, 1px -1px 0px #ff6b6b, -1px 1px 0px #ff6b6b'
                : 'inherit',
              transition: 'color 0.1s ease-out',
            }}
          >
            {char}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={{...getStyleConfig(), opacity: progress}}>
      {text}
    </div>
  );
};
