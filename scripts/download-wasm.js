const https = require('https');
const fs = require('fs');
const path = require('path');

const wasmDir = path.join(__dirname, '..', 'public', 'onnx-wasm');

// Create directory if it doesn't exist
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true });
}

const files = [
  'ort-wasm.wasm',
  'ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm',
  'ort-wasm-simd-threaded.wasm'
];

const baseUrl = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/';

files.forEach(file => {
  const url = baseUrl + file;
  const filePath = path.join(wasmDir, file);
  
  console.log(`Downloading ${file}...`);
  
  const fileStream = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`✅ Downloaded ${file}`);
    });
  }).on('error', (err) => {
    console.error(`❌ Error downloading ${file}:`, err.message);
  });
});