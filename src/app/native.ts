import { Capacitor, registerPlugin } from '@capacitor/core';

interface CapturePermissions {
  request(options: { microphone: boolean }): Promise<{ camera: boolean; microphone: boolean }>;
}
const permissions = Capacitor.isNativePlatform()
  ? registerPlugin<CapturePermissions>('CapturePermissions')
  : undefined;
export const isNative = () => Capacitor.isNativePlatform();
export async function ensureMediaPermissions(microphone = false) {
  if (!permissions) return;
  const granted = await permissions.request({ microphone });
  if (!granted.camera || (microphone && !granted.microphone))
    throw new Error('Kamera veya mikrofon izni verilmedi. Galeriden seçim yapabilirsin.');
}
export async function exportNative(blob: Blob, name: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const path = `formda-exports/${Date.now()}-${name.replace(/[^\w.-]/g, '_')}`;
  await Filesystem.writeFile({ path, data: '', directory: Directory.Cache, recursive: true });
  const chunkSize = 192 * 1024;
  for (let offset = 0; offset < blob.size; offset += chunkSize) {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.readAsDataURL(blob.slice(offset, offset + chunkSize));
    });
    await Filesystem.appendFile({ path, data, directory: Directory.Cache });
  }
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({
    title: 'Formda · Dosyan yanında',
    url: uri,
    dialogTitle: 'Cihaza kaydet veya paylaş',
  });
}
