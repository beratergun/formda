import { recordingMime } from './export';
export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  thumb: Blob;
}
export async function videoInfo(blob: Blob, knownDuration?: number): Promise<VideoInfo> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Video okunamadı.')), 15000);
      video.onloadeddata = () => {
        clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Bu video biçimi okunamadı.'));
      };
    });
    let duration = Number.isFinite(video.duration) ? video.duration : knownDuration || 0;
    if (!duration) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        video.ontimeupdate = () => {
          clearTimeout(timeout);
          resolve();
        };
        video.currentTime = 1e9;
      });
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = 0;
      });
    }
    const ratio = Math.min(1, 320 / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
    canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumb = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Kapak hazırlanamadı.'))),
        'image/webp',
        0.75,
      ),
    );
    return { duration, width: video.videoWidth, height: video.videoHeight, thumb };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
export async function trimVideo(
  blob: Blob,
  from: number,
  to: number,
  onProgress: (n: number) => void,
): Promise<Blob> {
  const mime = recordingMime();
  if (!mime || !HTMLCanvasElement.prototype.captureStream)
    throw new Error('Bu tarayıcı kırpmayı desteklemiyor; daha kısa bir video seç.');
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  let stream: MediaStream | undefined;
  let audio: AudioContext | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Video okunamadı.'));
    });
    if (from > 0)
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = from;
      });
    const scale = Math.min(1, 1280 / video.videoWidth, 720 / video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d')!;
    stream = canvas.captureStream(25);
    try {
      audio = new AudioContext();
      await audio.resume();
      const source = audio.createMediaElementSource(video);
      const destination = audio.createMediaStreamDestination();
      source.connect(destination);
      destination.stream.getAudioTracks().forEach((t) => stream!.addTrack(t));
    } catch {
      /* Video frames remain available without Web Audio. */
    }
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1500000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const complete = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
      recorder.onerror = () => reject(new Error('Video kırpılamadı.'));
    });
    recorder.start(500);
    await video.play();
    const started = performance.now();
    while (
      !video.ended &&
      video.currentTime < to &&
      performance.now() - started < (to - from) * 1000 + 3000
    ) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      onProgress(Math.min(99, Math.round(((video.currentTime - from) / (to - from)) * 100)));
      await new Promise(requestAnimationFrame);
    }
    recorder.stop();
    return await complete;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
    stream?.getTracks().forEach((t) => t.stop());
    await audio?.close();
  }
}
