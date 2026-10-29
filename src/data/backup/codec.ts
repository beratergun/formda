import { Zip, ZipPassThrough, unzipSync, strToU8, strFromU8 } from 'fflate';
import { backupSchema, type BackupDocument } from './schema';

export function encodeBackup(document: BackupDocument, files: Record<string, Uint8Array>): Promise<Uint8Array> {
  backupSchema.parse(document);
  return new Promise((resolve,reject) => {
    const chunks:Uint8Array[]=[];
    const zip=new Zip((error,chunk,final)=>{if(error){reject(error);return;}chunks.push(chunk);if(final){const bytes=new Uint8Array(chunks.reduce((a,c)=>a+c.length,0));let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}resolve(bytes);}});
    for(const [name,bytes] of Object.entries({'data.json':strToU8(JSON.stringify(document)),...files})) {const entry=new ZipPassThrough(name);zip.add(entry);entry.push(bytes,true);}
    zip.end();
  });
}
export function decodeBackup(bytes: Uint8Array) {
  let total=0;
  const files=unzipSync(bytes,{filter:file=>{total+=file.originalSize;if(file.originalSize>512*1024*1024||total>1024*1024*1024)throw new Error('Yedek bu cihazda işlenemeyecek kadar büyük.');if(!/^data\.json$|^media\/[\w-]+\.(bin|thumb)$/.test(file.name))throw new Error('Yedekte geçersiz dosya adı var.');return true;}});
  if(!files['data.json'])throw new Error('Yol yedek dosyası bulunamadı.');
  const document=backupSchema.parse(JSON.parse(strFromU8(files['data.json'])));
  for(const media of document.media){if(!files[`media/${media.id}.bin`]||!files[`media/${media.id}.thumb`]||files[`media/${media.id}.bin`].length!==media.sizeBytes)throw new Error('Yedekte eksik veya bozuk medya var.');}
  return {document,files};
}

export async function encodeBlobStream(document: BackupDocument, files: AsyncIterable<{name:string;blob:Blob}>): Promise<Blob> {
  backupSchema.parse(document);
  const chunks:Uint8Array<ArrayBuffer>[]=[];
  let failure:Error|undefined;
  const zip=new Zip((error,chunk)=>{if(error)failure=error;else chunks.push(new Uint8Array(chunk));});
  const metadata=new ZipPassThrough('data.json');zip.add(metadata);metadata.push(strToU8(JSON.stringify(document)),true);
  for await (const {name,blob} of files) {
    const entry=new ZipPassThrough(name);zip.add(entry);
    const reader=blob.stream().getReader();
    while(true){const {done,value}=await reader.read();if(done)break;entry.push(value);}
    entry.push(new Uint8Array(),true);
    if(failure)throw failure;
  }
  zip.end();if(failure)throw failure;
  return new Blob(chunks,{type:'application/zip'});
}
