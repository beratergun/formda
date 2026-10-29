import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
const icon=await readFile('public/icons/icon.svg');
for(const[width,height]of[[1170,2532],[1290,2796],[1179,2556],[750,1334]]){
  const size=Math.round(width*.22);const logo=await sharp(icon).resize(size,size).png().toBuffer();
  const text=Buffer.from(`<svg width="${width}" height="180"><text x="50%" y="60" text-anchor="middle" fill="#e6f0df" font-size="${Math.round(width*.065)}" font-family="sans-serif" font-weight="bold">Yol /</text><text x="50%" y="125" text-anchor="middle" fill="#c8dfd4" font-size="${Math.round(width*.022)}" font-family="sans-serif" letter-spacing="4">KENDİ RİTMİNDE.</text></svg>`);
  await sharp({create:{width,height,channels:4,background:'#126c6a'}}).composite([{input:logo,left:Math.round((width-size)/2),top:Math.round(height*.4-size/2)},{input:text,left:0,top:Math.round(height*.4+size/2+45)}]).png().toFile(`public/icons/splash-${width}-${height}.png`);
}
await mkdir('resources',{recursive:true});
await sharp(icon).resize(1024,1024).png().toFile('resources/icon.png');
const logo=await sharp(icon).resize(420,420).png().toBuffer();
await sharp({create:{width:2732,height:2732,channels:4,background:'#126c6a'}}).composite([{input:logo,gravity:'centre'}]).png().toFile('resources/splash.png');
