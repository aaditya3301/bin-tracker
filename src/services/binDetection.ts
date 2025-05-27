// Single class for trash bins
const CLASS_NAME = 'trash-bins';

interface DetectionResult {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

let ortModule: any = null;

// Load ONNX Runtime only on client side
const loadOrtModule = async () => {
  if (typeof window === 'undefined') {
    return null; // Skip on server side
  }
  
  if (ortModule) {
    return ortModule; // Return cached module if already loaded
  }

  try {
    // Dynamic import only runs on client side
    const ort = await import('onnxruntime-web');
    
    // Configure WASM paths
    ort.env.wasm.wasmPaths = {
      'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm.wasm',
      'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd.wasm',
      'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-threaded.wasm',
      'ort-wasm-simd-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd-threaded.wasm',
    } as Record<string, string>;
    
    ortModule = ort;
    return ort;
  } catch (error) {
    console.error("Failed to load ONNX Runtime:", error);
    return null;
  }
};

// Process YOLOv12 results
function processYolo12Results(output: any, imageWidth: number, imageHeight: number): DetectionResult[] {
  const data = output.data;
  const dims = output.dims;
  
  console.log("Output dimensions:", dims.join(','));
  console.log("First 10 values:", data.slice(0, 10));
  
  if (dims.length !== 3 || dims[0] !== 1) {
    console.error("Unexpected output dimensions:", dims);
    return [];
  }

  const numDetections = dims[2];
  const numAttributes = dims[1];
  
  console.log(`Parsing as YOLOv12 output: ${numDetections} candidate boxes`);
  
  const detections: DetectionResult[] = [];
  const confidenceThreshold = 0.6; // Keep this threshold
  
  for (let i = 0; i < numDetections; i++) {
    const x_center = data[i];
    const y_center = data[i + numDetections];
    const width = data[i + 2 * numDetections];
    const height = data[i + 3 * numDetections];
    const confidence = data[i + 4 * numDetections];
    
    if (confidence > confidenceThreshold) {
      const inputSize = 640;
      const scaleX = imageWidth / inputSize;
      const scaleY = imageHeight / inputSize;
      
      const x = (x_center - width / 2) * scaleX;
      const y = (y_center - height / 2) * scaleY;
      const w = width * scaleX;
      const h = height * scaleY;
      
      // RELAXED filtering for bins - bins can be various shapes and sizes
      const aspectRatio = h / w;
      const area = w * h;
      const imageArea = imageWidth * imageHeight;
      const relativeArea = area / imageArea;
      
      // Much more lenient filters
      const isReasonableShape = aspectRatio > 0.4 && aspectRatio < 4.0; // Very wide range
      const isReasonableSize = relativeArea > 0.005 && relativeArea < 0.95; // 0.5% to 95% of image
      
      if (isReasonableShape && isReasonableSize) {
        const clampedX = Math.max(0, Math.min(x, imageWidth));
        const clampedY = Math.max(0, Math.min(y, imageHeight));
        const clampedW = Math.min(w, imageWidth - clampedX);
        const clampedH = Math.min(h, imageHeight - clampedY);
        
        if (clampedW > 0 && clampedH > 0) {
          console.log(`Detection #${detections.length + 1}: conf=${confidence.toFixed(2)}, box=[${clampedX.toFixed(0)},${clampedY.toFixed(0)},${clampedW.toFixed(0)},${clampedH.toFixed(0)}], AR=${aspectRatio.toFixed(2)}`);
          
          detections.push({
            label: CLASS_NAME,
            confidence: confidence,
            bbox: [clampedX, clampedY, clampedW, clampedH]
          });
        }
      } else {
        console.log(`Filtered out detection: conf=${confidence.toFixed(2)}, AR=${aspectRatio.toFixed(2)}, size=${relativeArea.toFixed(4)} (shape: ${isReasonableShape}, size: ${isReasonableSize})`);
      }
    }
  }
  
  // Sort by confidence and apply NMS
  detections.sort((a, b) => b.confidence - a.confidence);
  const filteredDetections = applyNMS(detections, 0.4);
  
  console.log(`Found ${filteredDetections.length} detections above threshold`);
  
  return filteredDetections;
}

// Non-Maximum Suppression to remove overlapping detections
function applyNMS(detections: DetectionResult[], iouThreshold: number): DetectionResult[] {
  if (detections.length === 0) return [];
  
  const result: DetectionResult[] = [];
  const suppressed = new Set<number>();
  
  for (let i = 0; i < detections.length; i++) {
    if (suppressed.has(i)) continue;
    
    result.push(detections[i]);
    
    for (let j = i + 1; j < detections.length; j++) {
      if (suppressed.has(j)) continue;
      
      const iou = calculateIoU(detections[i].bbox, detections[j].bbox);
      if (iou > iouThreshold) {
        suppressed.add(j);
      }
    }
  }
  
  return result;
}

// Calculate Intersection over Union
function calculateIoU(bbox1: [number, number, number, number], bbox2: [number, number, number, number]): number {
  const [x1, y1, w1, h1] = bbox1;
  const [x2, y2, w2, h2] = bbox2;
  
  const x1_max = x1 + w1;
  const y1_max = y1 + h1;
  const x2_max = x2 + w2;
  const y2_max = y2 + h2;
  
  const intersectX1 = Math.max(x1, x2);
  const intersectY1 = Math.max(y1, y2);
  const intersectX2 = Math.min(x1_max, x2_max);
  const intersectY2 = Math.min(y1_max, y2_max);
  
  const intersectWidth = Math.max(0, intersectX2 - intersectX1);
  const intersectHeight = Math.max(0, intersectY2 - intersectY1);
  const intersectArea = intersectWidth * intersectHeight;
  
  const area1 = w1 * h1;
  const area2 = w2 * h2;
  const unionArea = area1 + area2 - intersectArea;
  
  return unionArea > 0 ? intersectArea / unionArea : 0;
}

// Update the main detection function threshold too
export async function detectBin(imageElement: HTMLImageElement): Promise<{
  isBin: boolean;
  detections: DetectionResult[];
  highestConfidence: number;
}> {
  try {
    console.log("Starting bin detection...");
    
    // Load ONNX Runtime first
    const ort = await loadOrtModule();
    if (!ort) {
      throw new Error("Failed to load ONNX Runtime");
    }
    
    const modelPath = '/models/hi.onnx';
    console.log(`Loading model from: ${modelPath}`);
    
    // Load the model
    const session = await ort.InferenceSession.create(modelPath);
    console.log("Model loaded successfully");
    
    // Get input names
    const inputNames = session.inputNames;
    console.log("Model expects these input names:", inputNames);
    
    // Preprocess image
    const inputTensor = preprocessImage(imageElement, ort);
    console.log("Image preprocessed");
    
    // Run inference
    const inputName = inputNames[0];
    console.log(`Running inference with input name '${inputName}'...`);
    const results = await session.run({ [inputName]: inputTensor });
    console.log("Inference completed");
    console.log("Output keys:", Object.keys(results));
    
    // Process results
    const output = results[Object.keys(results)[0]];
    const detections = processYolo12Results(output, imageElement.width, imageElement.height);
    console.log("Detections:", detections);
    
    // Find highest confidence
    const highestConfidence = detections.length > 0 
      ? Math.max(...detections.map(d => d.confidence))
      : 0;
    
    const isBin = detections.length > 0 && highestConfidence > 0.6; // Lower to 60%
    
    console.log(`Bin detected: ${isBin}, Confidence: ${highestConfidence}`);
    
    return {
      isBin,
      detections,
      highestConfidence
    };
    
  } catch (error) {
    console.error("Detection error:", error);
    throw error;
  }
}

// Preprocessing function for YOLOv12
function preprocessImage(imageElement: HTMLImageElement, ort: any): any {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // YOLOv12 expects 640x640 input
  const inputSize = 640;
  canvas.width = inputSize;
  canvas.height = inputSize;
  
  // Draw image scaled to fit canvas
  ctx.drawImage(imageElement, 0, 0, inputSize, inputSize);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
  const data = imageData.data;
  
  // Convert to RGB and normalize to [0, 1]
  const inputArray = new Float32Array(3 * inputSize * inputSize);
  
  for (let i = 0; i < inputSize * inputSize; i++) {
    const pixelIndex = i * 4;
    // Normalize from [0, 255] to [0, 1]
    inputArray[i] = data[pixelIndex] / 255.0;                    // R
    inputArray[i + inputSize * inputSize] = data[pixelIndex + 1] / 255.0;     // G
    inputArray[i + 2 * inputSize * inputSize] = data[pixelIndex + 2] / 255.0; // B
  }
  
  // Create tensor [1, 3, 640, 640]
  return new ort.Tensor('float32', inputArray, [1, 3, inputSize, inputSize]);
}