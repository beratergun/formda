import { drawStory, type StoryData } from './story-render';
self.onmessage = async (event: MessageEvent<StoryData>) => {
  try {
    const canvas = new OffscreenCanvas(1080, 1920);
    const context = canvas.getContext('2d')!;
    drawStory(context, event.data);
    self.postMessage({ blob: await canvas.convertToBlob({ type: 'image/png' }) });
  } catch {
    self.postMessage({ error: 'Görsel hazırlanamadı.' });
  }
};
