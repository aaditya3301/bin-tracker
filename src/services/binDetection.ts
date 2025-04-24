import * as ort from 'onnxruntime-web';

// Configure to use CDN-hosted WASM files
ort.env.wasm.wasmPaths = {
  'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm.wasm',
  'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-threaded.wasm',
};

// Single class for trash bins
const CLASS_NAME = 'trash-bins';

interface DetectionResult {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export async function detectBin(imageElement: HTMLImageElement): Promise<{
  isBin: boolean;
  detections: DetectionResult[];
  highestConfidence: number;
}> {
  try {
    console.log("Starting bin detection...");
    
    const modelPath = '/models/hi.onnx';
    console.log(`Loading model from: ${modelPath}`);
    
    // Create a session just once
    const session = await ort.InferenceSession.create(modelPath);
    console.log("Model loaded successfully");
    
    // Get input names from the model
    const modelInputs = session.inputNames;
    console.log("Model expects these input names:", modelInputs);
    
    const inputName = modelInputs[0]; // Use the first input name
    
    // Preprocess image for YOLOv11n - 640x640 is standard YOLOv11 input size
    const tensor = await preprocessImage(imageElement, 640, 640);
    console.log("Image preprocessed");
    
    // Run inference with the correct input name
    const feeds = {};
    feeds[inputName] = tensor;
    console.log(`Running inference with input name '${inputName}'...`);
    
    const results = await session.run(feeds);
    console.log("Inference completed");
    console.log("Output keys:", Object.keys(results));
    
    // Process YOLOv11n results
    const detections = processYolo11Results(results, imageElement.width, imageElement.height);
    console.log("Detections:", detections);
    
    // Get highest confidence detection
    let highestConfidence = 0;
    if (detections.length > 0) {
      highestConfidence = Math.max(...detections.map(d => d.confidence));
    }
    
    // Determine if a bin was detected - use a lower threshold
    const confidenceThreshold = 0.2; // Lower threshold for testing
    const isBin = detections.length > 0 && highestConfidence > confidenceThreshold;
    console.log(`Bin detected: ${isBin}, Confidence: ${highestConfidence}`);
    
    return {
      isBin,
      detections,
      highestConfidence
    };
  } catch (error) {
    console.error("Error detecting bin:", error);
    return {
      isBin: false,
      detections: [],
      highestConfidence: 0
    };
  }
}

// Preprocessing function for YOLOv11n
async function preprocessImage(img: HTMLImageElement, width: number, height: number): Promise<ort.Tensor> {
  // Create a canvas for image preprocessing
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  // Draw and resize the image
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  // Prepare data for YOLOv11n (NCHW format, normalized to [0,1])
  const rgbData = new Float32Array(3 * height * width);
  
  // Populate RGB channels (NCHW format)
  let pixelIndex = 0;
  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const srcIdx = (h * width + w) * 4;
        rgbData[pixelIndex++] = data[srcIdx + c] / 255.0;  // Normalize to [0,1]
      }
    }
  }
  
  // Create tensor in correct format for YOLOv11n
  return new ort.Tensor('float32', rgbData, [1, 3, height, width]);
}

// Process YOLOv11n results specifically for the [1,5,8400] output format
function processYolo11Results(results: ort.InferenceSession.ReturnType, imgWidth: number, imgHeight: number): DetectionResult[] {
  // Get the output - typically named "output0" in YOLO ONNX models
  const outputName = Object.keys(results)[0];
  const output = results[outputName];
  
  if (!output || !output.data || output.dims.length === 0) {
    console.error("Invalid output format");
    return [];
  }
  
  console.log(`Output dimensions: ${output.dims}`);
  
  const detections: DetectionResult[] = [];
  
  try {
    // Extract data from output tensor
    const outputData = output.data as Float32Array;
    const dimensions = output.dims;
    
    // Log first few values to understand format
    console.log("First 10 values:", outputData.slice(0, 10));
    
    // Handle YOLOv11n single-class output format: [1, 5, 8400] 
    // where 5 = [x, y, w, h, confidence]
    if (dimensions.length === 3 && dimensions[1] === 5) {
      const numBoxes = dimensions[2];
      
      console.log(`Parsing as YOLOv11n output: ${numBoxes} candidate boxes`);
      
      // Confidence threshold - can be adjusted
      const confidenceThreshold = 0.2;
      
      // Process each detection
      // Format is: [x, y, w, h, conf] for each of the 8400 boxes
      for (let i = 0; i < numBoxes; i++) {
        const cx = outputData[0 * numBoxes + i]; // Center x
        const cy = outputData[1 * numBoxes + i]; // Center y
        const w = outputData[2 * numBoxes + i];  // Width
        const h = outputData[3 * numBoxes + i];  // Height
        const conf = outputData[4 * numBoxes + i]; // Confidence
        
        // Skip low confidence detections
        if (conf < confidenceThreshold) continue;
        
        // Convert normalized coordinates to absolute image coordinates
        const bbox: [number, number, number, number] = [
          (cx - w/2) * imgWidth,  // x1 (top-left corner)
          (cy - h/2) * imgHeight, // y1 
          w * imgWidth,           // width
          h * imgHeight           // height
        ];
        
        detections.push({
          label: CLASS_NAME,
          confidence: conf,
          bbox
        });
        
        // Debug first few detections
        if (detections.length <= 3) {
          console.log(`Detection #${detections.length}: conf=${conf.toFixed(2)}, box=[${bbox.map(v => v.toFixed(0)).join(',')}]`);
        }
      }
      
      // If we have too many detections, sort by confidence and keep top ones
      if (detections.length > 20) {
        detections.sort((a, b) => b.confidence - a.confidence);
        detections.splice(20); // Keep only top 20
      }
    } else {
      console.log("Unexpected output format. Dimensions:", dimensions);
    }
    
    console.log(`Found ${detections.length} detections above threshold`);
    return detections;
  } catch (error) {
    console.error("Error processing YOLO results:", error);
    return [];
  }
}