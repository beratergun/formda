export interface StoryData {
  title: string;
  value: string;
  unit: string;
  detail: string;
  date: string;
  index: number;
}
export function drawStory(
  c: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  d: StoryData,
) {
  c.fillStyle = '#102e30';
  c.fillRect(0, 0, 1080, 1920);
  c.strokeStyle = '#74d8c5';
  c.lineWidth = 12;
  c.beginPath();
  c.arc(820, 600, 400, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#f1f6e9';
  c.font = 'bold 72px sans-serif';
  c.fillText('Formda', 80, 160);
  c.font = '32px sans-serif';
  c.fillText(d.date, 80, 240);
  c.font = 'bold 48px sans-serif';
  c.fillText(d.title, 80, 440, 920);
  c.font = 'bold 180px sans-serif';
  c.fillText(d.value, 80, 820, 920);
  c.font = '42px sans-serif';
  c.fillText(d.unit, 80, 920, 920);
  c.font = '32px sans-serif';
  c.fillText(d.detail, 80, 1220, 920);
  c.fillText('Kişisel spor ve beslenme koçun', 80, 1680, 920);
  c.fillText(`${d.index}/3 · Kendi ritminde.`, 80, 1780);
}
export async function storyFallback(data: StoryData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Görsel hazırlanamadı.');
  drawStory(context, data);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Görsel hazırlanamadı.'))),
      'image/png',
    ),
  );
}
