// PURE YOLO11 API CLIENT - NO MOCK DATA

export interface DetectionResult {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  class_id: number;
}

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
}

// API Configuration - UPDATED FOR RENDER
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-render-app-name.onrender.com';

// Health check function
export async function checkAPIHealth(): Promise<boolean> {
  try {
    console.log('🔍 Checking API health...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout for Render
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const isHealthy = data.status === 'healthy' && data.model_loaded;
      console.log(isHealthy ? '✅ API is healthy' : '⚠️ API unhealthy');
      return isHealthy;
    }
    
    console.log('❌ API health check failed');
    return false;
  } catch (error) {
    console.log('❌ API health check error:', error);
    return false;
  }
}

// Main detection function
export async function detectBin(
  imageElement: HTMLImageElement,
  confidenceThreshold: number = 0.5
): Promise<BinDetectionResponse> {
  
  console.log(`🚀 Starting detection via Render API (threshold: ${confidenceThreshold})`);
  
  try {
    // Check if running in browser
    if (typeof window === 'undefined') {
      throw new Error('Detection only available in browser environment');
    }
    
    // Convert image to base64
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }
    
    // Draw image and get base64 data
    ctx.drawImage(imageElement, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
    
    console.log('📤 Sending image to Render API...');
    
    // Call detection API with longer timeout for Render
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds for Render cold starts
    
    const response = await fetch(`${API_BASE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        threshold: 0.3
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Transform response to match expected format
    const transformedResult: BinDetectionResponse = {
      success: result.success || false,
      isBin: result.isBin || false,
      lowestConfidence: result.lowestConfidence || 0,
      message: result.message?.replace(/lowest /gi, '') || 'Detection completed', // Remove "lowest" word
      totalDetections: result.totalDetections || 0,
      error: result.error,
      
      // Legacy compatibility
      highestConfidence: result.lowestConfidence || 0,
      detections: []
    };
    
    console.log(`✅ Detection complete via Render:`, {
      success: transformedResult.success,
      isBin: transformedResult.isBin,
      detections: transformedResult.totalDetections,
      confidence: `${(transformedResult.lowestConfidence * 100).toFixed(1)}%`,
      canProceed: transformedResult.isBin ? 'YES (≥75%)' : 'NO (<75%)'
    });
    
    return transformedResult;
    
  } catch (error) {
    console.error('❌ Render API detection failed:', error);
    
    // Check if it's a network error
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Detection timeout - Render may be warming up, please try again';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to Render API - check if service is running';
      } else {
        errorMessage = error.message;
      }
    }
    
    // Return error response in expected format
    return {
      success: false,
      isBin: false,
      lowestConfidence: 0,
      message: `Detection failed: ${errorMessage}`,
      totalDetections: 0,
      error: errorMessage,
      
      // Legacy compatibility
      highestConfidence: 0,
      detections: []
    };
  }
}

export type { BinDetectionResponse };