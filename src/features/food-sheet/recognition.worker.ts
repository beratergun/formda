import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url';
import moduleUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url';
import {
  env,
  AutoModelForImageClassification,
  AutoProcessor,
  RawImage,
  ImageClassificationPipeline,
  type ProgressCallback,
} from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.wasmPaths = {
    wasm: new URL(wasmUrl, self.location.href).href,
    mjs: new URL(moduleUrl, self.location.href).href,
  };
}
let classifier: ImageClassificationPipeline | undefined;
self.onmessage = async (event: MessageEvent<{ image: Blob }>) => {
  try {
    if (!classifier) {
      const modelId = 'onnx-community/swin-finetuned-food101-ONNX';
      const options = {
        revision: 'e5e50bfc6425aa546f3b4421ca8bd79d0dd610b8',
        device: 'wasm' as const,
        dtype: 'q8' as const,
        progress_callback: ((progress) => {
          if (progress.status === 'progress')
            self.postMessage({ progress: Math.round(progress.progress) });
        }) satisfies ProgressCallback,
      };
      // Load the known image components directly; generic task discovery probes
      // optional tokenizer files that cannot be resolved after going offline.
      const [model, processor] = await Promise.all([
        AutoModelForImageClassification.from_pretrained(modelId, options),
        AutoProcessor.from_pretrained(modelId, options),
      ]);
      classifier = new ImageClassificationPipeline({
        task: 'image-classification',
        model,
        processor,
      });
    }
    const image = await RawImage.fromBlob(event.data.image);
    const result = await classifier(image, { top_k: 3 });
    self.postMessage({ predictions: result });
  } catch {
    self.postMessage({
      error:
        'Model bu cihazda çalıştırılamadı. Fotoğrafın kayıtlı; içeriğini yazarak veya arayarak ekleyebilirsin.',
    });
  }
};
