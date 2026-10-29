async function compress(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  let image = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
  if (image.type !== 'image/webp')
    image = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  const thumbCanvas = new OffscreenCanvas(
    Math.max(1, Math.round(width * Math.min(1, 320 / width))),
    Math.max(1, Math.round(height * Math.min(1, 320 / width))),
  );
  thumbCanvas.getContext('2d')!.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumb = await thumbCanvas.convertToBlob({ type: 'image/webp', quality: 0.75 });
  return { image, thumb, width, height };
}
self.onmessage = async (event: MessageEvent<Blob>) => {
  try {
    self.postMessage({ result: await compress(event.data) });
  } catch {
    self.postMessage({ error: 'Fotoğraf işlenemedi. Başka bir fotoğraf seçebilirsin.' });
  }
};
