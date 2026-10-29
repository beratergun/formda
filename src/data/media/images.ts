import { saveMedia } from './opfs';
import type { MediaRecord } from '../../domain/types';

export interface CompressedImage {image:Blob;thumb:Blob;width:number;height:number}
export function compressImage(blob:Blob):Promise<CompressedImage>{
  if(blob.size>40*1024*1024)return Promise.reject(new Error('Lütfen 40 MB altında bir fotoğraf seç.'));
  return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./image.worker.ts',import.meta.url),{type:'module'});worker.onmessage=(e:MessageEvent<{result:CompressedImage;error?:string}>)=>{worker.terminate();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.result);};worker.onerror=()=>{worker.terminate();reject(new Error('Fotoğraf işlenemedi.'));};worker.postMessage(blob);});
}
export async function addImage(blob:Blob,date:string,kind:MediaRecord['kind'],pose?:string){const result=await compressImage(blob);return saveMedia({id:crypto.randomUUID(),date,kind,pose,thumb:result.thumb,width:result.width,height:result.height,mime:result.image.type,tags:[]},result.image);}
