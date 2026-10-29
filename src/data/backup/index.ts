import { db, seedDatabase, type YolDatabase } from '../db';
import { clearAllData } from '../media/opfs';
import type { MediaRecord } from '../../domain/types';
import type { decodeBackup } from './codec';

type Decoded=ReturnType<typeof decodeBackup>;
let nextId=0;
function runWorker<T>(payload:object):Promise<T> {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./backup.worker.ts',import.meta.url),{type:'module'});
    const id=nextId++;
    worker.onmessage=(event:MessageEvent<{id:number;result:T;error?:string}>)=>{worker.terminate();if(event.data.error)reject(new Error(event.data.error));else resolve(event.data.result);};
    worker.onerror=()=>{worker.terminate();reject(new Error('Yedek işlenemedi.'));};
    worker.postMessage({...payload,id});
  });
}
export async function createBackup(database:YolDatabase=db) {
  const blob=await runWorker<Blob>({action:'create',databaseName:database.name});
  await database.meta.put({key:'lastBackupAt',value:new Date().toISOString()});
  return blob;
}
export async function restoreBackup(blob:Blob, mode:'merge'|'replace', database=db) {
  if(blob.size>1024*1024*1024)throw new Error('Yedek bu cihazda işlenemeyecek kadar büyük.');
  const decoded=await runWorker<Decoded>({action:'decode',bytes:new Uint8Array(await blob.arrayBuffer())});
  await applyBackup(decoded,mode,database);
}
export async function applyBackup({document,files}:Decoded, mode:'merge'|'replace', database=db) {
  const media:MediaRecord[]=document.media.map(record=>({...record,blob:new Blob([new Uint8Array(files[`media/${record.id}.bin`])],{type:record.mime}),thumb:new Blob([new Uint8Array(files[`media/${record.id}.thumb`])],{type:'image/webp'})}));
  // All validation and media decoding finish before the atomic replacement begins.
  await database.transaction('rw',database.tables,async()=>{
    if(mode==='replace')for(const table of database.tables)await table.clear();
    for(const [name,values]of Object.entries(document.data))await database.table(name).bulkPut(values);
    await database.media.bulkPut(media);await database.exercise.bulkPut(document.exercises);
  });
}
export async function resetDatabase() {await clearAllData();await seedDatabase();}
