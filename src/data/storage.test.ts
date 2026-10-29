import { it, expect, afterEach } from 'vitest';
import { YolDatabase, seedDatabase } from './db';
import { LocalRepository } from './repositories';
import { saveMedia, readMedia, deleteMedia, clearAllData } from './media/opfs';
import { decodeBackup, encodeBackup } from './backup/codec';
import { applyBackup } from './backup';
import { emptyDay } from '../domain/types';
import type { BackupDocument } from './backup/schema';

const databases:YolDatabase[]=[];
function fresh(){const database=new YolDatabase(`test-${crypto.randomUUID()}`);databases.push(database);return database;}
afterEach(async()=>{await Promise.all(databases.splice(0).map(database=>database.delete()));});
it('seeds once and persists transactional updates without changing unrelated tables',async()=>{
  const database=fresh();await seedDatabase(database);const repository=new LocalRepository(database);
  await repository.replace({dayLog:[{...emptyDay('2026-10-29'),water:4}]});await seedDatabase(database);
  const data=await repository.load();expect(data.dayLog[0].water).toBe(4);expect(data.food.length).toBeGreaterThanOrEqual(300);expect(data.quote.length).toBeGreaterThanOrEqual(150);
});
it('uses IndexedDB Blob fallback and removes a media record',async()=>{
  const database=fresh();const blob=new Blob(['image-bytes'],{type:'image/webp'});
  const record=await saveMedia({id:'test',date:'2026-10-29',kind:'progress',thumb:blob,width:100,height:100,tags:[],mime:'image/webp'},blob,database);
  expect(await (await readMedia(record)).text()).toBe('image-bytes');await deleteMedia('test',database);expect(await database.media.count()).toBe(0);
});
it('round-trips all data and media through zip, delete, restore exactly',async()=>{
  const database=fresh();await seedDatabase(database);await database.dayLog.put({...emptyDay('2026-10-29'),note:'Türkçe günlük',water:5});
  const data=await new LocalRepository(database).load();
  const raw=new Uint8Array([0,1,128,255]);const thumb=new Uint8Array([3,4,5]);
  const document:BackupDocument={format:'yol-backup',version:1,createdAt:'2026-10-29',data,media:[{id:'media-1',date:'2026-10-29',kind:'vlog',width:1280,height:720,sizeBytes:4,tags:['antrenman'],mime:'video/webm'}],exercises:[]};
  const bytes=await encodeBackup(document,{'media/media-1.bin':raw,'media/media-1.thumb':thumb});const decoded=decodeBackup(bytes);
  expect(decoded.document).toEqual(document);expect(decoded.files['media/media-1.bin']).toEqual(raw);
  await clearAllData(database);expect(await database.dayLog.count()).toBe(0);await applyBackup(decoded,'replace',database);
  expect(await new LocalRepository(database).load()).toEqual(data);expect(new Uint8Array(await (await readMedia((await database.media.get('media-1'))!)).arrayBuffer())).toEqual(raw);
  await database.dayLog.put(emptyDay('2026-10-30'));await applyBackup(decoded,'merge',database);expect(await database.dayLog.count()).toBe(2);
});
it('rejects malformed data and incomplete media before any data is replaced',async()=>{
  expect(()=>decodeBackup(new Uint8Array([1,2,3]))).toThrow();
  const database=fresh();await seedDatabase(database);const data=await new LocalRepository(database).load();
  const document:BackupDocument={format:'yol-backup',version:1,createdAt:'now',data,media:[{id:'test',date:'2026-10-29',kind:'progress',width:1,height:1,sizeBytes:4,tags:[],mime:'image/webp'}],exercises:[]};
  const bytes=await encodeBackup(document,{});expect(()=>decodeBackup(bytes)).toThrow('eksik');expect(await database.food.count()).toBeGreaterThan(300);
  expect(()=>encodeBackup({...document,version:2} as unknown as BackupDocument,{})).toThrow();
});
it('rejects a media byte corruption even if the stored file size is unchanged',async()=>{
  const database=fresh();await seedDatabase(database);const data=await new LocalRepository(database).load();
  const raw=new Uint8Array([123,45,67,89,231,199]);const document:BackupDocument={format:'yol-backup',version:1,createdAt:'now',data,media:[{id:'crc-test',date:'2026-10-29',kind:'progress',width:1,height:1,sizeBytes:raw.length,tags:[],mime:'image/webp'}],exercises:[]};
  const bytes=await encodeBackup(document,{'media/crc-test.bin':raw,'media/crc-test.thumb':new Uint8Array([1])});
  const index=bytes.findIndex((_,i)=>raw.every((value,n)=>bytes[i+n]===value));expect(index).toBeGreaterThan(0);bytes[index]^=1;expect(()=>decodeBackup(bytes)).toThrow('bütünlük');
});
