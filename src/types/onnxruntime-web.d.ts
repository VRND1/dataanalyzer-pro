declare module 'onnxruntime-web' {
  export class InferenceSession {
    static create(modelPath: string): Promise<InferenceSession>;
    run(feeds: Record<string, any>): Promise<Record<string, any>>;
  }

  export class Tensor {
    constructor(
      type: string,
      data: Float32Array | Int32Array | Uint8Array,
      dims: number[]
    );
  }
} 