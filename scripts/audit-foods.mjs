import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const sourcePath =
  process.argv[2] ||
  `${tmpdir()}/yol-food-source/FoodData_Central_sr_legacy_food_json_2018-04.json`;
const bytes = await readFile(sourcePath),
  official = JSON.parse(bytes).SRLegacyFoods;
const originals = new Map(official.map((f) => [f.fdcId, f]));
const usda = JSON.parse(await readFile('src/data/seed/usda-foods.json', 'utf8'));
const reference = JSON.parse(await readFile('src/data/seed/legacy-foods.json', 'utf8'));
const ingredientIds = JSON.parse(await readFile('scripts/recipe-ingredients.json', 'utf8'));
const rows = JSON.parse(await readFile('scripts/turkish-recipes.json', 'utf8'));
const nutrient = (food, id) => food.foodNutrients.find((n) => n.nutrient.id === id)?.amount;
const originalIds = new Set(JSON.parse(await readFile('scripts/original-food-ids.json', 'utf8')));
const audit = [];
for (const food of usda) {
  const id = Number(food.id.slice(5)),
    source = originals.get(id);
  if (
    !source ||
    food.kcalPer !== nutrient(source, 1008) ||
    food.proteinPer !== nutrient(source, 1003)
  )
    throw new Error(`Source mismatch: ${food.id}`);
  food.sourceId = `fdc:${id}`;
  food.sourceKind = 'usda';
  food.sourceDescription = source.description;
  const qualifiers = [];
  for (const [regex, label] of [
    [/\bleaves\b/, 'yaprak'],
    [/(?<!without )\bskin\b/, 'kabuk / deri içerir'],
    [/without skin/, 'kabuksuz'],
    [/meat and skin/, 'et ve deri'],
    [/meat only/, 'yalnız et'],
    [/with added solution/, 'ek çözeltili'],
    [/sprouted/, 'filizlendirilmiş'],
    [/pickled/, 'turşu'],
    [/candied/, 'şekerlenmiş'],
    [/with added sugar/, 'şeker ilaveli'],
    [/without added sugar/, 'şeker ilavesiz'],
    [/\bgreen\b/, 'yeşil çeşit'],
    [/\byellow\b/, 'sarı çeşit'],
    [/\bred\b/, 'kırmızı çeşit'],
    [/(?<!un)sweetened/, 'tatlandırılmış'],
    [/\bnonfat\b|\bskim\b/, 'yağsız'],
    [/2% milkfat/, '%2 yağlı'],
    [/3.25% milkfat/, '%3,25 yağlı'],
    [/95% lean/, '%5 yağlı'],
    [/93% lean/, '%7 yağlı'],
  ])
    if (regex.test(source.description)) qualifiers.push(label);
  const base = food.name.split(' · ')[0];
  food.name = `${base}${qualifiers.length ? ' · ' + qualifiers.join(', ') : ''} · FDC ${id}`;
  if (originalIds.has(food.id))
    audit.push({
      id: food.id,
      sourceId: food.sourceId,
      status: 'verified-exact',
      kcal: food.kcalPer,
      protein: food.proteinPer,
      description: source.description,
    });
}
const names = {
  egg: 'Yumurta (çiğ, bütün)',
  chicken: 'Tavuk göğüs (çiğ, derisiz)',
  beef: 'Dana kıyma (çiğ, %5 yağ)',
  lamb: 'Kuzu kıyma (çiğ)',
  rice: 'Beyaz pirinç (çiğ)',
  flour: 'Buğday unu',
  lentil: 'Mercimek (çiğ)',
  beans: 'Beyaz kuru fasulye (çiğ)',
  chickpea: 'Nohut (çiğ)',
  bulgur: 'Bulgur (kuru)',
  onion: 'Soğan (çiğ)',
  tomato: 'Kırmızı domates (çiğ)',
  pepper: 'Yeşil biber (çiğ)',
  zucchini: 'Kabak (çiğ)',
  eggplant: 'Patlıcan (çiğ)',
  potato: 'Patates (çiğ, kabuklu)',
  carrot: 'Havuç (çiğ)',
  spinach: 'Ispanak (çiğ)',
  milk: 'Süt (%2 yağlı)',
  yogurt: 'Yoğurt (tam yağlı)',
  feta: 'Beyaz peynir (feta)',
  mushroom: 'Mantar (çiğ)',
  greenbeans: 'Taze fasulye (çiğ)',
  okra: 'Bamya (çiğ)',
  leek: 'Pırasa (çiğ)',
  cabbage: 'Lahana (çiğ)',
  cauliflower: 'Karnabahar (çiğ)',
  broccoli: 'Brokoli (çiğ)',
  peas: 'Bezelye (çiğ)',
  artichoke: 'Enginar (çiğ)',
  celeriac: 'Kereviz kökü (çiğ)',
  pumpkin: 'Bal kabağı (çiğ)',
  water: 'İçme suyu',
  oil: 'Zeytinyağı',
  butter: 'Tereyağı (tuzlu)',
  sugar: 'Toz şeker',
  honey: 'Bal',
  semolina: 'İrmik',
  oats: 'Yulaf',
  pasta: 'Makarna (kuru)',
  walnut: 'Ceviz',
  hazelnut: 'Fındık',
  almond: 'Badem',
  sesame: 'Susam',
  cocoa: 'Kakao (şekersiz)',
  raisin: 'Kuru üzüm',
  lemon: 'Limon suyu',
  cucumber: 'Salatalık (kabuklu)',
  parsley: 'Maydanoz',
  garlic: 'Sarımsak',
  strawberry: 'Çilek',
  orange: 'Portakal',
  apple: 'Elma (kabuklu)',
  banana: 'Muz',
  tea: 'Demlenmiş şekersiz çay',
  coffee: 'Sade filtre kahve',
};
for (const [key, id] of Object.entries(ingredientIds)) {
  if (usda.some((f) => f.id === `usda-${id}`)) continue;
  const f = originals.get(id);
  if (!f) throw new Error(`Missing FDC ${id}`);
  const n = (id) => nutrient(f, id);
  usda.push({
    id: `usda-${id}`,
    name: names[key],
    aliases: [f.description, names[key]],
    unit: 'g',
    per: 100,
    kcalPer: n(1008),
    proteinPer: n(1003),
    carbPer: n(1005),
    fatPer: n(1004),
    fiberPer: n(1079),
    state: /raw|dry|flour/.test(f.description)
      ? 'raw'
      : /cooked/.test(f.description)
        ? 'cooked'
        : 'na',
    source: `USDA FoodData Central · SR Legacy 2018 · https://fdc.nal.usda.gov/food-details/${id}/nutrients`,
    sourceId: `fdc:${id}`,
    sourceKind: 'usda',
    sourceDescription: f.description,
    portions: [{ label: '100 g', qty: 100 }],
    useCount: 0,
  });
}
// Compatibility records are explicitly distinguished from measured USDA data.
// Existing meals/menu arithmetic and old backups keep their original values.

const recipes = [],
  recipeFoods = [];
const byId = new Map(usda.map((f) => [f.id, f]));
for (const [slug, name, cookedWeightG, portionG, ingredients] of rows) {
  const id = `tr-recipe-${slug}`;
  const entries = Object.entries(ingredients).map(([key, qty]) => {
    if (!ingredientIds[key]) throw new Error(`Unknown ingredient ${key}`);
    return { foodId: `usda-${ingredientIds[key]}`, qty };
  });
  const values = { kcal: 0, protein: 0, carb: 0, fat: 0 };
  for (const item of entries) {
    const f = byId.get(item.foodId);
    for (const [key, field] of Object.entries({
      kcal: 'kcalPer',
      protein: 'proteinPer',
      carb: 'carbPer',
      fat: 'fatPer',
    })) {
      if (!Number.isFinite(f[field])) throw new Error(`Missing ${field}: ${item.foodId}`);
      values[key] += (f[field] * item.qty) / 100;
    }
  }
  recipes.push({
    id,
    name,
    ingredients: entries,
    cookedWeightG,
    servings: cookedWeightG / portionG,
  });
  recipeFoods.push({
    id,
    name,
    aliases: [name, slug.replaceAll('-', ' ')],
    unit: 'g',
    per: 100,
    kcalPer: (values.kcal / cookedWeightG) * 100,
    proteinPer: (values.protein / cookedWeightG) * 100,
    carbPer: (values.carb / cookedWeightG) * 100,
    fatPer: (values.fat / cookedWeightG) * 100,
    state: [
      'salata-yagsiz',
      'kahvalti-sebzesi',
      'sogan-havuc',
      'coban-salata',
      'kasik-salata',
      'gavurdagi',
    ].includes(slug)
      ? 'raw'
      : /ayran|limonata|icecek|suyu|sut$|sutlu-kahve|soguk-cay|haydari|cacik|meyveli-yogurt/.test(
            slug,
          )
        ? 'na'
        : 'cooked',
    source: `Örnek tarif · USDA malzemeleriyle hesaplandı; porsiyon/yönteme göre değişir · ${entries.map((i) => i.foodId.replace('usda-', 'FDC ')).join(', ')}`,
    sourceId: id,
    sourceKind: 'recipe',
    recipeId: id,
    portions: [
      { label: '100 g', qty: 100 },
      { label: `1 porsiyon (${portionG} g)`, qty: portionG },
    ],
    useCount: 0,
  });
}
const direct = {
  egg: [171287, 50],
  eggw: [172183, 33],
  tavuk: [171077, 100],
  hindi: [171098, 100],
  kiyma: [173110, 100],
  hamsi: [174182, 100],
  ton: [171986, 100],
  suzme: [170903, 100],
  yogurt: [170886, 100],
  lor: [172182, 100],
  sut: [171267, (244 / 240) * 100],
  kefir: [170904, 100],
  ekmek: [172688, 100],
  yulaf: [169705, 100],
  mercimek: [172420, 100],
  nohut: [173757, 100],
  fasulye: [175203, 100],
  patates: [170438, 100],
  yag: [171413, 100],
  zeytin: [169096, 100],
  ceviz: [170187, 100],
  elma: [171688, 100],
  muz: [173944, 100],
  mandalina: [169105, 100],
  portakal: [169097, 100],
  bitter: [170273, 100],
  cay: [173227, 200],
  beyazpeynir: [173420, 100],
  kasar: [171241, 100],
  makarna: [168928, 100],
  tavukpismis: [171477, 100],
  hamburger: [170693, 110],
  pizza: [170317, 107],
  kizartma: [170698, 100],
  kola: [174852, 100],
  meyvesuyu: [169098, 100],
  sutlucik: [167587, 100],
  biskuvi: [172819, 100],
  findik: [170581, 100],
  badem: [170567, 100],
  hurma: [171726, 7],
  bal: [169640, 7],
  seker: [169655, 5],
  proteintozu: [173180, 30],
  karpuz: [167765, 100],
  uzum: [174683, 100],
};
const recipeAliases = {
  simit: 'simit',
  pilav: 'pirinc-pilavi',
  bulgur: 'bulgur-pilavi',
  kofte: 'izgara-kofte',
  durum: 'tavuk-durum',
  lahmacun: 'lahmacun',
  pide: 'kiymali-pide',
  corba: 'mercimek-corbasi',
  ayran: 'ayran',
  tostkasar: 'peynirli-tost',
  salata: 'salata-yagsiz',
  kahvsebze: 'kahvalti-sebzesi',
  sogan: 'sogan-havuc',
  sebze: 'haslanmis-sebze',
};
const descriptions = {
  lor: 'Taneli taze peynir (%2 yağlı, lor için referans)',
  kasar: 'Gouda peyniri (kaşar için referans)',
  proteintozu: 'Peynir altı suyu protein tozu (USDA referansı, 30 g)',
  kefir: 'Kefir (sade, az yağlı, LIFEWAY referansı)',
  pizza: 'Peynirli pizza (pişmiş, 107 g dilim)',
  hamburger: 'Hamburger (sade, tek küçük köfte, 110 g)',
  tostkasar: 'Beyaz peynirli ev tostu (200 g)',
  kiyma: 'Dana kıyma (çiğ, %7 yağ)',
  patates: 'Patates (haşlanmış, kabuksuz)',
  cay: 'Şekersiz demlenmiş çay (200 g)',
};
for (const food of reference) {
  const before = { kcal: food.kcalPer, protein: food.proteinPer };
  if (direct[food.id]) {
    const [id, grams] = direct[food.id],
      f = originals.get(id);
    if (!f) throw new Error(`Missing direct FDC ${id}`);
    const factor = grams / 100;
    food.kcalPer = nutrient(f, 1008) * factor;
    food.proteinPer = nutrient(f, 1003) * factor;
    food.carbPer = nutrient(f, 1005) === undefined ? undefined : nutrient(f, 1005) * factor;
    food.fatPer = nutrient(f, 1004) === undefined ? undefined : nutrient(f, 1004) * factor;
    if (['egg', 'eggw'].includes(food.id)) {
      food.kcalPer = Math.round(food.kcalPer);
      food.proteinPer = Math.round(food.proteinPer * 10) / 10;
    }
    food.sourceId = `fdc:${id}`;
    food.sourceKind = 'usda';
    food.sourceDescription = f.description;
    food.source = `USDA FoodData Central · FDC ${id} · ${grams} g / kayıt birimi${['egg', 'eggw'].includes(food.id) ? '; adet kcal tam sayıya, protein 0,1 g hassasiyete yuvarlandı' : ''} · https://fdc.nal.usda.gov/food-details/${id}/nutrients`;
  } else {
    const recipe = recipeFoods.find((r) => r.id === `tr-recipe-${recipeAliases[food.id]}`);
    if (!recipe) throw new Error(`No correction for ${food.id}`);
    const grams = food.unit === 'adet' ? recipe.portions[1].qty : 100;
    food.kcalPer = (recipe.kcalPer * grams) / 100;
    food.proteinPer = (recipe.proteinPer * grams) / 100;
    food.carbPer = (recipe.carbPer * grams) / 100;
    food.fatPer = (recipe.fatPer * grams) / 100;
    food.source = recipe.source;
    food.sourceId = recipe.sourceId;
    food.sourceKind = 'recipe';
    food.recipeId = recipe.id;
  }
  if (descriptions[food.id]) food.name = descriptions[food.id];
  if (!direct[food.id]) food.state = recipeFoods.find((r) => r.id === food.recipeId).state;
  audit.push({
    id: food.id,
    sourceId: food.sourceId,
    status: 'corrected-from-reference',
    previous: before,
    kcal: food.kcalPer,
    protein: food.proteinPer,
    description: food.sourceDescription,
  });
}
const fixture = Object.entries(ingredientIds)
  .slice(0, 35)
  .map(([key, id]) => {
    const f = originals.get(id);
    return {
      key,
      id: `usda-${id}`,
      sourceId: `fdc:${id}`,
      description: f.description,
      kcal: nutrient(f, 1008),
      protein: nutrient(f, 1003),
    };
  });
for (const [path, value] of Object.entries({
  'src/data/seed/usda-foods.json': usda,
  'src/data/seed/reference-foods.json': reference,
  'src/data/seed/turkish-recipes.json': recipes,
  'src/data/seed/recipe-foods.json': recipeFoods,
  'src/data/seed/usda-source-fixture.json': fixture,
  'docs/food-audit.json': {
    date: '2026-10-30',
    release: 'USDA SR Legacy April 2018',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    records: audit,
    verified: audit.filter((r) => r.status === 'verified-exact').length,
    corrected: reference.length,
    recipes: recipes.length,
  },
}))
  await writeFile(path, JSON.stringify(value, null, 2) + '\n');
console.log(
  JSON.stringify({
    audited: audit.length,
    usda: usda.length,
    legacy: reference.length,
    recipes: recipes.length,
    fixture: fixture.length,
  }),
);
