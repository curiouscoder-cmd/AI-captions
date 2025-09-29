import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config: any) => {
    // Handle .node files for Transformers.js
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    
    // Add support for WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
  
  // Allow external domains for model loading
  images: {
    domains: ['huggingface.co'],
  },
  
  // Headers for CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
