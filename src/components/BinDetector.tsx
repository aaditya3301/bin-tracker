"use client"

import { useState, useEffect, useRef } from 'react'
import { detectBin } from '@/services/binDetection'

interface BinDetectorProps {
  imageUrl: string;
  onDetectionComplete: (isBin: boolean, confidence: number) => void;
  onRequestNewImage: () => void;
}

export default function BinDetector({ 
  imageUrl, 
  onDetectionComplete,
  onRequestNewImage 
}: BinDetectorProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [confidence, setConfidence] = useState(0);
  const [isBin, setIsBin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const detectRunRef = useRef(false);
  const imageUrlRef = useRef('');

  // Run detection when image changes
  useEffect(() => {
    if (imageUrl && imageUrl !== imageUrlRef.current && !detectRunRef.current) {
      imageUrlRef.current = imageUrl;
      setImageLoaded(false);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (!detectRunRef.current) {
      runDetection();
    }
  };

  const runDetection = async () => {
    if (detectRunRef.current) return;
    
    detectRunRef.current = true;
    setStatus('loading');
    setErrorMessage('');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const result = await detectBin(img);
      
      setIsBin(result.isBin);
      setConfidence(result.highestConfidence);
      setStatus(result.isBin ? 'success' : 'error');
      
      onDetectionComplete(result.isBin, result.highestConfidence);
      
    } catch (error) {
      console.error('Detection error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Detection failed');
      setIsBin(false);
      setConfidence(0);
      onDetectionComplete(false, 0);
    } finally {
      detectRunRef.current = false;
    }
  };

  const handleRetry = () => {
    detectRunRef.current = false;
    imageUrlRef.current = '';
    runDetection();
  };

  return (
    <div className="space-y-4"> {/* Removed max-width constraint */}
      {/* Bigger Image Display */}
      <div className="relative bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
        <img 
          src={imageUrl} 
          alt="Uploaded bin" 
          className="w-full h-64 object-contain mx-auto block" // Increased back to h-64
          onLoad={handleImageLoad}
        />
        
        {/* Loading Overlay */}
        {(status === 'loading' || !imageLoaded) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">{!imageLoaded ? 'Loading image...' : 'Analyzing image...'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Detection Results */}
      {status === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-green-800">Bin Detected!</span>
          </div>
          <p className="text-green-700">
            Confidence: <span className="font-bold">{(confidence * 100).toFixed(1)}%</span>
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-semibold text-red-800">
              {confidence > 0 ? 'Low Confidence Detection' : 'No Bin Detected'}
            </span>
          </div>
          {confidence > 0 ? (
            <p className="text-red-700">
              Confidence: <span className="font-bold">{(confidence * 100).toFixed(1)}%</span>
            </p>
          ) : (
            <p className="text-red-700">
              {errorMessage || 'No waste bin detected.'}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRequestNewImage}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Upload Different Image
        </button>
        
        {status === 'error' && (
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Detection
          </button>
        )}
      </div>
    </div>
  );
}