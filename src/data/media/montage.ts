import type { MediaRecord } from '../../domain/types';
import { readMedia } from './opfs';
import { recordingMime } from './export';

async function photoFrame(record:MediaRecord){const blob=await readMedia(record);return new Promise<ImageBitmap>((resolve,reject)=>{const worker=new Worker(new URL('./montage.worker.ts',import.meta.url),{type:'module'});worker.onmessage=(e:MessageEvent<{bitmap:ImageBitmap;error?:string}>)=>{worker.terminate();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.bitmap);};worker.onerror=()=>{worker.terminate();reject(new Error('Video karesi hazırlanamadı.'));};worker.postMessage({blob,record:{...record,blob:undefined,thumb:undefined}});});}
function nextFrame(){return new Promise<number>(resolve=>requestAnimationFrame(resolve));}
export async function createMontage(records:MediaRecord[],onProgress:(n:number)=>void,signal?:AbortSignal){
  const mime=recordingMime();if(!mime||!HTMLCanvasElement.prototype.captureStream)throw new Error('Bu tarayıcı video oluşturmayı desteklemiyor. Fotoğraflarını tek tek indirebilirsin.');
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=960;const context=canvas.getContext('2d')!;const stream=canvas.captureStream(25);const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1500000});const chunks:Blob[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const stopped=new Promise<Blob>((resolve,reject)=>{recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType}));recorder.onerror=()=>reject(new Error('Video oluşturulamadı.'));});
  recorder.start(500);
  try{
    for(let i=0;i<records.length;i++){
      if(signal?.aborted)throw new Error('Video oluşturma iptal edildi.');
      const record=records[i];
      if(record.kind==='vlog'&&record.mime.startsWith('video/')){
        const url=URL.createObjectURL(await readMedia(record));const video=document.createElement('video');video.src=url;video.muted=true;video.playsInline=true;video.preload='auto';
        try{await new Promise<void>((resolve,reject)=>{video.onloadeddata=()=>resolve();video.onerror=()=>reject(new Error('Video okunamadı.'));});await video.play();const start=performance.now();while(performance.now()-start<1000&&!video.ended){if(signal?.aborted)throw new Error('Video oluşturma iptal edildi.');context.fillStyle='#102e2c';context.fillRect(0,0,720,960);const scale=Math.min(720/video.videoWidth,860/video.videoHeight);const w=video.videoWidth*scale,h=video.videoHeight*scale;context.drawImage(video,(720-w)/2,(860-h)/2,w,h);context.fillStyle='#e5f3dc';context.font='30px sans-serif';context.fillText('Yol · '+record.date,35,918);await nextFrame();}}finally{video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
      }else{const bitmap=await photoFrame(record);context.drawImage(bitmap,0,0);bitmap.close();const start=performance.now();while(performance.now()-start<1000){if(signal?.aborted)throw new Error('Video oluşturma iptal edildi.');await nextFrame();}}
      onProgress(Math.round((i+1)/records.length*100));
    }
    recorder.stop();return await stopped;
  }finally{if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop());}
}
