"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Loader2, Camera, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { configureOnnxRuntime } from '@/lib/env'

// Updated types to match new API response
interface BinDetectionResponse {
  success: boolean;
  isBin: boolean;
  lowestConfidence: number;
  message: string;
  totalDetections: number;
  error?: string;
  
  // Legacy compatibility fields
  highestConfidence?: number;
  detections?: any[];
  processedImageUrl?: string;
}

interface BinDetectorProps {
  imageUrl: string
  onDetectionComplete: (isBin: boolean, confidence: number) => void
  onRequestNewImage: () => void
  confidenceThreshold?: number
}

export default function BinDetector({ 
  imageUrl, 
  onDetectionComplete, 
  onRequestNewImage,
  confidenceThreshold = 0.5 
}: BinDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState<BinDetectionResponse | null>(null)
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  const [detectionService, setDetectionService] = useState<any>(null)

  // Load detection service on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      configureOnnxRuntime()
      
      // Dynamically import detection service
      import('@/services/binDetection').then((module) => {
        setDetectionService(module)
        console.log('🔧 Detection service loaded')
      }).catch((error) => {
        console.error('❌ Failed to load detection service:', error)
      })
    }
  }, [])

  // Create image element when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      const img = new Image()
      img.onload = () => {
        setImageElement(img)
        setDetectionResult(null)
        console.log('🖼️ Image loaded successfully')
      }
      img.onerror = () => {
        console.error('❌ Failed to load image')
      }
      img.src = imageUrl
    }
  }, [imageUrl])

  // Run detection
  const runDetection = async () => {
    if (!imageElement || !detectionService) {
      console.error('❌ Image element or detection service not available')
      return
    }

    setIsDetecting(true)
    
    try {
      console.log(`🚀 Starting detection with threshold: ${confidenceThreshold}`)
      
      const result = await detectionService.detectBin(imageElement, confidenceThreshold)
      
      console.log('✅ Detection completed:', result)
      
      // Handle both new and legacy response formats
      const confidence = result.lowestConfidence || result.highestConfidence || 0
      const totalDetections = result.totalDetections || (result.detections?.length || 0)
      
      console.log(`📊 Results: isBin=${result.isBin}, confidence=${(confidence * 100).toFixed(1)}%, detections=${totalDetections}`)
      
      setDetectionResult(result)
      onDetectionComplete(result.isBin, confidence)
      
    } catch (error: any) {
      console.error('❌ Detection failed:', error)
      const errorResult: BinDetectionResponse = {
        success: false,
        isBin: false,
        lowestConfidence: 0,
        message: `Detection error: ${error?.message || 'Unknown error'}`,
        totalDetections: 0,
        error: error?.message || 'Unknown error'
      }
      setDetectionResult(errorResult)
      onDetectionComplete(false, 0)
    } finally {
      setIsDetecting(false)
    }
  }

  // Reset detection
  const resetDetection = () => {
    setDetectionResult(null)
    console.log('🔄 Detection reset')
  }

  // Get confidence display values
  const getDisplayConfidence = () => {
    if (!detectionResult) return 0
    return detectionResult.lowestConfidence || detectionResult.highestConfidence || 0
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return 'text-emerald-700 bg-emerald-50 border-emerald-300'
    if (confidence >= 0.5) return 'text-amber-700 bg-amber-50 border-amber-300'
    return 'text-red-700 bg-red-50 border-red-300'
  }

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.75) return 'High (Ready for next step)'
    if (confidence >= 0.5) return 'Medium'
    return 'Low'
  }

  const canProceedToNextStep = () => {
    if (!detectionResult) return false
    const confidence = getDisplayConfidence()
    return detectionResult.isBin && confidence >= 0.75
  }

  return (
    <div className="space-y-6">
      {/* Image Display */}
      <div className="relative group">
        <img
          src={imageUrl}
          alt="Bin detection"
          className="w-full max-h-80 object-contain rounded-lg border-2 border-gray-200 shadow-sm"
        />
        
        {/* Subtle Loading Indicator - NO WHITE DIALOG */}
        {isDetecting && (
          <div className="absolute bottom-4 right-4">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Detection Controls */}
      <div className="flex gap-3">
        {!isDetecting && !detectionResult && (
          <Button
            type="button"
            onClick={runDetection}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            disabled={!detectionService || !imageElement}
          >
            <Camera className="h-5 w-5 mr-2" />
            {detectionService ? 'Detect Bin' : 'Loading...'}
          </Button>
        )}

        {isDetecting && (
          <div className="flex-1 flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <span className="font-medium">Running Analysis...</span>
          </div>
        )}

        {detectionResult && !isDetecting && (
          <Button
            type="button"
            onClick={resetDetection}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Detect Again
          </Button>
        )}

        <Button
          type="button"
          onClick={onRequestNewImage}
          className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Change Image
        </Button>
      </div>

      {/* Detection Results */}
      {detectionResult && (
        <div className="space-y-4">
          {/* Main Result */}
          <div className={`p-6 rounded-xl border-2 shadow-sm ${
            detectionResult.isBin 
              ? canProceedToNextStep()
                ? 'bg-emerald-50 border-emerald-300' 
                : 'bg-amber-50 border-amber-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center space-x-4">
              {detectionResult.isBin ? (
                canProceedToNextStep() ? (
                  <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
                )
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-bold text-lg ${
                  detectionResult.isBin 
                    ? canProceedToNextStep()
                      ? 'text-emerald-900' 
                      : 'text-amber-900'
                    : 'text-red-900'
                }`}>
                  {detectionResult.isBin 
                    ? canProceedToNextStep()
                      ? '✅ Bin Detected - Ready for Next Step!'
                      : '⚠️ Bin Detected - Confidence Too Low'
                    : '❌ No Bin Detected'
                  }
                </p>
                <p className={`text-sm mt-1 ${
                  detectionResult.isBin 
                    ? canProceedToNextStep()
                      ? 'text-emerald-700' 
                      : 'text-amber-700'
                    : 'text-red-700'
                }`}>
                  {/* UPDATED: Remove "lowest" from message */}
                  {detectionResult.message?.replace(/lowest /gi, '') || 'Detection completed'}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence Score */}
          <div className={`p-6 rounded-xl border-2 shadow-sm ${getConfidenceColor(getDisplayConfidence())}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg">
                Confidence Score
                <span className="text-sm text-gray-600 ml-2 font-normal">(Min: 75% to proceed)</span>
              </span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/50">
                {getConfidenceLevel(getDisplayConfidence())}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-300 rounded-full h-4 shadow-inner">
                <div 
                  className={`h-4 rounded-full transition-all duration-700 shadow-sm ${
                    getDisplayConfidence() >= 0.75 ? 'bg-emerald-500' :
                    getDisplayConfidence() >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(getDisplayConfidence() * 100, 100)}%` }}
                />
              </div>
              <span className="font-bold text-2xl min-w-[80px] text-right">
                {(getDisplayConfidence() * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Progress to 75% threshold */}
            <div className="mt-3 text-sm">
              {getDisplayConfidence() < 0.75 ? (
                <span className="text-gray-600">
                  Need <span className="font-semibold">{((0.75 - getDisplayConfidence()) * 100).toFixed(1)}%</span> more to proceed
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  ✅ Ready to proceed!
                </span>
              )}
            </div>
          </div>

          {/* Next Step Indicator */}
          {detectionResult.isBin && (
            <div className={`p-4 rounded-xl border-2 shadow-sm ${
              canProceedToNextStep() 
                ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                : 'bg-orange-100 border-orange-400 text-orange-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {canProceedToNextStep() 
                    ? '🎯 Ready for Next Step' 
                    : '⏳ Need Higher Confidence'}
                </span>
                <span className={`text-sm font-bold px-4 py-2 rounded-full ${
                  canProceedToNextStep()
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-orange-200 text-orange-900'
                }`}>
                  {canProceedToNextStep() ? 'PROCEED' : 'RETRY'}
                </span>
              </div>
            </div>
          )}

          {/* API Status */}
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg border">
            {detectionResult.success ? (
              <>✅ Detection API: Successful • Threshold: 75% minimum to proceed</>
            ) : (
              <>❌ Detection API: {detectionResult.error || 'Failed'}</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}