// Environment configuration for ONNX Runtime
export const configureOnnxRuntime = () => {
  if (typeof window !== 'undefined') {
    // Client-side configuration
    (globalThis as any).process = {
      env: {},
      versions: { node: '18.0.0' },
      platform: 'browser'
    };
    
    (globalThis as any).Buffer = {
      from: (data: any) => new Uint8Array(data),
      isBuffer: () => false
    };
  }
};