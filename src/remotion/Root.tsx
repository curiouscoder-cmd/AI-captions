import React from 'react';
import {Composition} from 'remotion';
import {CaptionedVideo} from './CaptionedVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        durationInFrames={300} // Will be dynamic
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: '',
          captions: [],
          style: 'bottom'
        }}
      />
    </>
  );
};
