import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = JSON.parse(await readFile('reference/fooddb.json', 'utf8'));
await mkdir('src/data/seed', { recursive: true });
const aliases = { egg: ['yumurta', 'tam yumurta'], eggw: ['yumurta beyazı'], tavuk: ['tavuk', 'tavuk göğsü'], tavukpismis: ['tavuk', 'tavuk göğsü'], ekmek: ['ekmek', 'tam buğday ekmeği'], cay: ['çay', 'kahve', 'şekersiz çay'], corba: ['mercimek çorbası', 'çorba'] };
const portions = { ekmek: [{label:'dilim',qty:30}], corba: [{label:'kase',qty:1}], suzme: [{label:'kase',qty:150}], yogurt: [{label:'kase',qty:200}], sut: [{label:'bardak',qty:200}], kefir: [{label:'bardak',qty:200}], ayran: [{label:'bardak',qty:200}], elma: [{label:'orta boy',qty:150}], muz: [{label:'orta boy',qty:120}], yag: [{label:'kaşık',qty:10}], pilav: [{label:'porsiyon',qty:150}], makarna: [{label:'porsiyon',qty:150}] };
const foods = Object.entries(source.db).filter(([id])=>id !== 'ekmekdilim').map(([id,f])=>({ id, name:f.ad, aliases:aliases[id]||[f.ad.split(' (')[0]], unit:f.birim, per:f.per, kcalPer:f.kcal, proteinPer:f.p, state:f.ad.includes('çiğ')?'raw':/pişmiş|haşlanmış|fırın/.test(f.ad)?'cooked':'na', source:'Referans menü · yaklaşık değer; tarif/markaya göre değişir', portions:portions[id]||[{label:f.birim==='adet'?'adet':'porsiyon',qty:f.birim==='adet'?1:100}],useCount:0 }));
await writeFile('src/data/seed/reference-foods.json',JSON.stringify(foods,null,2)+'\n');
const days=source.plan.map(day=>Object.fromEntries(Object.entries(day).map(([id,meal])=>[id,{title:meal.t,items:meal.items.map(([foodId,qty])=>({foodId,qty,state:foods.find(f=>f.id===foodId).state}))}])));
await writeFile('src/data/seed/menu.json',JSON.stringify({id:'main',days},null,2)+'\n');
