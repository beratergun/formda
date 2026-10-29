import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

// Official SR Legacy release. Build-time import only; no requests from the app.
const data = JSON.parse(await readFile(`${tmpdir()}/formda-food-source/FoodData_Central_sr_legacy_food_json_2018-04.json`, 'utf8')).SRLegacyFoods;
const names = {
  Apples:'Elma', Apricots:'Kayısı', Avocados:'Avokado', Bananas:'Muz', Blackberries:'Böğürtlen', Blueberries:'Yaban mersini', Cherries:'Kiraz', Cranberries:'Turna yemişi', Dates:'Hurma', Figs:'İncir', Grapefruit:'Greyfurt', Grapes:'Üzüm', Guavas:'Guava', Kiwifruit:'Kivi', Lemons:'Limon', Limes:'Misket limonu', Mangoes:'Mango', Melons:'Kavun', Nectarines:'Nektarin', Oranges:'Portakal', Papayas:'Papaya', Peaches:'Şeftali', Pears:'Armut', Persimmons:'Trabzon hurması', Pineapple:'Ananas', Plums:'Erik', Pomegranates:'Nar', Raspberries:'Ahududu', Strawberries:'Çilek', Tangerines:'Mandalina', Watermelon:'Karpuz', Raisins:'Kuru üzüm', Prunes:'Kuru erik',
  Artichokes:'Enginar', Asparagus:'Kuşkonmaz', Beets:'Pancar', Broccoli:'Brokoli', 'Brussels sprouts':'Brüksel lahanası', Cabbage:'Lahana', Carrots:'Havuç', Cauliflower:'Karnabahar', Celery:'Kereviz', Chard:'Pazı', Chicory:'Hindiba', Collards:'Kara lahana', Corn:'Mısır', Cucumber:'Salatalık', Eggplant:'Patlıcan', Endive:'Hindiba', Fennel:'Rezene', Garlic:'Sarımsak', Ginger:'Zencefil', Kale:'Kara lahana', Kohlrabi:'Alabaş', Leeks:'Pırasa', Lettuce:'Marul', Mushrooms:'Mantar', Okra:'Bamya', Onions:'Soğan', Parsley:'Maydanoz', Parsnips:'Yabani havuç', Peas:'Bezelye', Peppers:'Biber', Potatoes:'Patates', Pumpkin:'Bal kabağı', Radishes:'Turp', Rutabagas:'Şalgam', Shallots:'Arpacık soğan', Spinach:'Ispanak', Squash:'Kabak', 'Sweet potato':'Tatlı patates', Tomatoes:'Domates', Turnips:'Şalgam', 'Water chestnuts':'Su kestanesi',
  'Beans, kidney':'Kırmızı fasulye', 'Beans, black':'Siyah fasulye', 'Beans, navy':'Beyaz fasulye', 'Beans, pinto':'Barbunya', 'Beans, white':'Kuru fasulye', 'Beans, snap':'Taze fasulye', 'Broadbeans':'Bakla', 'Chickpeas':'Nohut', Lentils:'Mercimek', Cowpeas:'Börülce', Edamame:'Edamame', Soybeans:'Soya fasulyesi', Tofu:'Tofu', Tempeh:'Tempeh', Peanuts:'Yer fıstığı',
  Barley:'Arpa', Buckwheat:'Karabuğday', Bulgur:'Bulgur', Couscous:'Kuskus', Millet:'Darı', Oats:'Yulaf', Quinoa:'Kinoa', Rice:'Pirinç', Rye:'Çavdar', Sorghum:'Sorgum', Spaghetti:'Spagetti', Macaroni:'Makarna', Pasta:'Makarna', Wheat:'Buğday', 'Wheat flour':'Buğday unu', 'Rice flour':'Pirinç unu', 'Corn flour':'Mısır unu', 'Oat bran':'Yulaf kepeği', 'Wheat bran':'Buğday kepeği',
  Almonds:'Badem', Hazelnuts:'Fındık', Walnuts:'Ceviz', Pistachio:'Antep fıstığı', Cashew:'Kaju', Pecans:'Pekan cevizi', 'Nuts, almonds':'Badem', 'Nuts, hazelnuts':'Fındık', 'Nuts, walnuts':'Ceviz', 'Nuts, pistachio':'Antep fıstığı', 'Nuts, cashew':'Kaju', 'Seeds, sesame':'Susam', 'Seeds, flaxseed':'Keten tohumu', 'Seeds, chia':'Chia tohumu', 'Seeds, sunflower':'Ay çekirdeği', 'Seeds, pumpkin':'Kabak çekirdeği',
  'Chicken, broilers or fryers, breast':'Tavuk göğsü', 'Chicken, broilers or fryers, thigh':'Tavuk but', 'Turkey, breast':'Hindi göğsü', 'Turkey, whole':'Hindi', 'Beef, ground':'Dana kıyma', 'Lamb, ground':'Kuzu kıyma', 'Fish, salmon':'Somon', 'Fish, sardine':'Sardalya', 'Fish, tuna':'Ton balığı', 'Fish, trout':'Alabalık', 'Fish, cod':'Morina', 'Fish, anchovy':'Hamsi', 'Fish, mackerel':'Uskumru', 'Fish, sea bass':'Levrek', 'Fish, herring':'Ringa', 'Crustaceans, shrimp':'Karides', 'Mollusks, mussel':'Midye',
  'Cheese, feta':'Beyaz peynir (feta)', 'Cheese, cheddar':'Çedar', 'Cheese, mozzarella':'Mozzarella', 'Cheese, cottage':'Taneli taze peynir', 'Cheese, ricotta':'Ricotta', 'Cheese, parmesan':'Parmesan', 'Yogurt, plain':'Sade yoğurt', 'Milk, whole':'Tam yağlı süt', 'Milk, reduced fat':'Az yağlı süt', 'Milk, lowfat':'Yağsız süt', 'Egg, whole':'Tam yumurta', 'Egg, white':'Yumurta beyazı', Butter:'Tereyağı', 'Oil, olive':'Zeytinyağı', 'Oil, sunflower':'Ayçiçek yağı', 'Oil, canola':'Kanola yağı', 'Bread, whole-wheat':'Tam buğday ekmeği', 'Bread, rye':'Çavdar ekmeği', 'Bread, pita':'Pide ekmeği', 'Bread, white':'Beyaz ekmek', Honey:'Bal', Sugars:'Şeker', 'Cocoa, dry powder':'Kakao', 'Chocolate, dark':'Bitter çikolata', 'Chocolate, milk':'Sütlü çikolata', 'Soup, lentil':'Mercimek çorbası', 'Soup, tomato':'Domates çorbası', 'Soup, chicken':'Tavuk çorbası', 'Soup, vegetable':'Sebze çorbası', 'Soup, mushroom':'Mantar çorbası',
};
const output=[];
for (const [prefix,turkish] of Object.entries(names)) {
  const candidates=data.filter(f=>f.description.toLowerCase().startsWith(prefix.toLowerCase()) && !/babyfood|infant|brand|restaurant|fast food|formula|imitation/i.test(f.description));
  candidates.sort((a,b)=>a.description.length-b.description.length);
  const selected=[];
  for (const state of ['raw','cooked','na']) {
    const matches=candidates.filter(f=>(/raw|uncooked|dry$/.test(f.description)?'raw':/cooked|boiled|roasted|baked|stewed|fried/.test(f.description)?'cooked':'na')===state);
    selected.push(...matches.slice(0,2));
  }
  for(const f of selected) {
    if(output.some(x=>x.id===`usda-${f.fdcId}`))continue;
    const nutrient=id=>f.foodNutrients.find(n=>n.nutrient.id===id)?.amount;
    const kcal=nutrient(1008), protein=nutrient(1003);
    if(kcal===undefined||protein===undefined)continue;
    const state=/raw|uncooked|dry$/.test(f.description)?'raw':/cooked|boiled|roasted|baked|stewed|fried/.test(f.description)?'cooked':'na';
    const details=[state==='raw'?'çiğ':state==='cooked'?'pişmiş':'', /without salt/.test(f.description)?'tuzsuz':/with salt/.test(f.description)?'tuzlu':'', /canned/.test(f.description)?'konserve':'', /frozen/.test(f.description)?'dondurulmuş':'', /dried|dehydrated/.test(f.description)?'kurutulmuş':''].filter(Boolean);
    const duplicate=output.filter(x=>x.name.startsWith(turkish)).length;
    output.push({id:`usda-${f.fdcId}`,name:`${turkish}${details.length?` (${details.join(', ')})`:''}${duplicate?` · SR ${f.ndbNumber}`:''}`,aliases:[f.description,turkish],unit:'g',per:100,kcalPer:kcal,proteinPer:protein,carbPer:nutrient(1005),fatPer:nutrient(1004),fiberPer:nutrient(1079),state,source:`USDA FoodData Central · SR Legacy 2018 · FDC ${f.fdcId} · https://fdc.nal.usda.gov/food-details/${f.fdcId}/nutrients`,portions:[{label:'100 g',qty:100}],useCount:0});
  }
}
await writeFile('src/data/seed/usda-foods.json',JSON.stringify(output,null,2)+'\n');
console.log(`Imported ${output.length} foods with recorded USDA nutrients.`);
