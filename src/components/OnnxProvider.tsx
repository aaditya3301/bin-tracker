'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import * as onnx from 'onnxruntime-web';

// Extend Window interface to include ort property
declare global {
  interface Window {
    ort: typeof onnx;
  }
}

// This tells Next.js to only import onnxruntime-web on the client side
const OnnxRuntimeComponent = ({ children }: { children: React.ReactNode }) => {
  const [isOnnxLoaded, setIsOnnxLoaded] = useState(false);

  useEffect(() => {
    const loadOnnx = async () => {
      try {
        const ort = await import('onnxruntime-web');
        
        // Configure ONNX to use CDN for WASM files
        ort.env.wasm.wasmPaths = {
          'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm.wasm',
          'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd.wasm',
          'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-threaded.wasm',
          'ort-wasm-simd-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd-threaded.wasm',
        } as Record<string, string>;

        // Store ort in the window object for global access if needed
        window.ort = ort;
        setIsOnnxLoaded(true);
      } catch (error) {
        console.error("Failed to load ONNX Runtime:", error);
      }
    };

    loadOnnx();
  }, []);

  // Render children only when ONNX is loaded
  return isOnnxLoaded ? <>{children}</> : <div>Loading AI model...</div>;
};

// Use dynamic import with ssr: false
export default dynamic(() => Promise.resolve(OnnxRuntimeComponent), { ssr: false });