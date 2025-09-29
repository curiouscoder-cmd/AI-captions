'use client';

import {CaptionApp} from '@/components/CaptionApp';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎬 Remotion Caption Studio
          </h1>
          <p className="text-gray-300 text-lg">
            Upload MP4 → Auto-generate captions → Export with style
          </p>
        </div>
        <CaptionApp />
      </div>
    </div>
  );
}
