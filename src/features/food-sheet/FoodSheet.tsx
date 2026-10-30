import { useEffect, useMemo, useRef, useState } from 'react';
import { Recognition, FOOD_MATCHES } from './Recognition';
import { Camera, Check, Copy, Search, Star, Trash2 } from 'lucide-react';
import { useStore, newId } from '../../app/Store';
import { NumericInput, Button, Card, Chip, EmptyState, Segmented, Sheet, Stepper } from '../../ui';
import { MEALS, type Food, type FoodState, type MealEntry, type MealId } from '../../domain/types';
import { calculate, recipeFood, total } from '../../domain/calories';
import { parseMeal, searchFoods } from '../../domain/parser';
import { convertWeight } from '../../domain/cooking';
import { shiftDate, weekday } from '../../domain/dates';
import { addImage } from '../../data/media/images';
import { searchPackaged } from './off';
import { ensureMediaPermissions } from '../../app/native';
const tabs = [
  { value: 'search', label: 'Ara' },
  { value: 'text', label: 'Yazarak' },
  { value: 'photo', label: 'Fotoğraf' },
  { value: 'packaged', label: 'Paketli ürün' },
  { value: 'recipes', label: 'Tarif' },
  { value: 'copy', label: 'Kopyala' },
] as const;
export function FoodSheet({
  onClose,
  initialMeal = 'kahvalti',
}: {
  onClose: () => void;
  initialMeal?: MealId;
}) {
  const { data, date, mutate, addMeals, setError } = useStore();
  const [tab, setTab] = useState<(typeof tabs)[number]['value']>('search');
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Food>();
  const [qty, setQty] = useState(100);
  const [state, setState] = useState<FoodState | ''>('');
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ReturnType<typeof parseMeal>>([]);
  const [recognitionPhoto, setRecognitionPhoto] = useState<Blob>();
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [products, setProducts] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [cookedWeight, setCookedWeight] = useState(500);
  const [servings, setServings] = useState(2);
  const [portionName, setPortionName] = useState('porsiyon');
  const [conversionFood, setConversionFood] = useState('chicken');
  const [conversionState, setConversionState] = useState<'raw' | 'cooked'>('cooked');
  const [conversionQty, setConversionQty] = useState(150);
  const [recipeItems, setRecipeItems] = useState<
    {
      foodId: string;
      qty: number;
    }[]
  >([]);
  const request = useRef<AbortController>();
  useEffect(() => {
    const status = () => setOnline(navigator.onLine);
    window.addEventListener('online', status);
    window.addEventListener('offline', status);
    return () => {
      window.removeEventListener('online', status);
      window.removeEventListener('offline', status);
      request.current?.abort();
    };
  }, []);
  const results = useMemo(() => searchFoods(query, data.food).slice(0, 15), [query, data.food]);
  const choose = (food: Food) => {
    setSelected(food);
    setQty(food.portions[0]?.qty || food.per);
    setState(food.state);
    setMessage('');
  };
  const make = (food: Food, amount: number, chosenState: FoodState): MealEntry => ({
    id: newId(),
    date,
    mealId: meal,
    foodId: food.id,
    name: food.name,
    qty: amount,
    unit: food.unit,
    state: chosenState,
    ...calculate(food, amount),
    photoIds,
    createdAt: Date.now(),
  });
  const addSelected = () => {
    if (!selected || !state || qty <= 0) return;
    addMeals([make(selected, qty, state)]);
    onClose();
  };
  const addParsed = () => {
    if (rows.some((r) => !r.food || r.issue)) return;
    addMeals(rows.map((r) => make(r.food!, r.qty, r.state!)));
    onClose();
  };
  const selectResult = (food: Food) => {
    if (tab === 'recipes') {
      setRecipeItems([...recipeItems, { foodId: food.id, qty: food.portions[0]?.qty || food.per }]);
      setQuery('');
    } else choose(food);
  };
  const searchRemote = async () => {
    if (!query.trim() || !online) return;
    setLoading(true);
    setMessage('');
    request.current?.abort();
    request.current = new AbortController();
    try {
      const foods = await searchPackaged(query, request.current.signal);
      setProducts(foods);
      if (!foods.length) setMessage('Bu aramada ürün bulunamadı.');
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };
  const upload = async (file: File) => {
    setRecognitionPhoto(file);
    setLoading(true);
    try {
      const media = await addImage(file, date, 'meal');
      setRecognitionPhoto(file);
      setPhotoIds([...photoIds, media.id]);
      setMessage('Fotoğraf cihazına kaydedildi. İçeriğini arayarak veya yazarak ekle.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Fotoğraf eklenemedi.');
    } finally {
      setLoading(false);
    }
  };
  const scan = async () => {
    type Detector = {
      detect: (video: HTMLVideoElement) => Promise<
        {
          rawValue: string;
        }[]
      >;
    };
    const ctor = (
      window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => Detector;
      }
    ).BarcodeDetector;
    if (!ctor) {
      setMessage('Bu tarayıcıda barkodu elle yazabilirsin.');
      return;
    }
    let stream: MediaStream | undefined;
    try {
      await ensureMediaPermissions(false);
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      const detector = new ctor({ formats: ['ean_13', 'ean_8', 'upc_a'] });
      let found = false;
      for (let i = 0; i < 20; i++) {
        const hits = await detector.detect(video);
        if (hits[0]) {
          setQuery(hits[0].rawValue);
          setMessage('Barkod okundu. Paketli ürün ara düğmesine dokun.');
          found = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!found) setMessage('Barkod okunamadı; elle yazabilirsin.');
    } catch {
      setMessage('Kamera açılamadı; barkodu elle yazabilirsin.');
    } finally {
      stream?.getTracks().forEach((t) => t.stop());
    }
  };
  const saveRecipe = () => {
    try {
      const recipe = {
        id: newId(),
        name: recipeName.trim(),
        ingredients: recipeItems,
        cookedWeightG: cookedWeight,
        servings,
      };
      if (!recipe.name || !recipeItems.length) return;
      const food = recipeFood(recipe, data.food);
      food.portions[0].label = portionName.trim() || 'porsiyon';
      mutate((v) => ({ recipe: [...v.recipe, recipe], food: [...v.food, food] }));
      choose(food);
      setTab('search');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tarif kaydedilemedi.');
    }
  };
  const foodList = (foods: Food[]) =>
    foods.map((food) => (
      <div key={food.id} className="food-result">
        <button className="food-pick" onClick={() => selectResult(food)}>
          <span>
            <strong>{food.name}</strong>
            <small>
              {food.per} {food.unit} · {food.kcalPer} kcal · {food.proteinPer} g protein
            </small>
          </span>
          <Chip>{food.state === 'raw' ? 'Çiğ' : food.state === 'cooked' ? 'Pişmiş' : 'Hazır'}</Chip>
        </button>
        <Button
          variant="quiet"
          aria-label={`${food.name} favori`}
          aria-pressed={!!food.favorite}
          onClick={() =>
            mutate((v) => ({
              food: v.food.map((f) => (f.id === food.id ? { ...f, favorite: !f.favorite } : f)),
            }))
          }
        >
          <Star size={16} fill={food.favorite ? 'currentColor' : 'none'} />
        </Button>
      </div>
    ));
  const macros = selected ? calculate(selected, qty) : undefined;
  return (
    <Sheet title="Öğününe ekle" onClose={onClose}>
      <label className="field">
        Öğün
        <select value={meal} onChange={(e) => setMeal(e.target.value as MealId)}>
          {MEALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <Segmented
        label="Ekleme yöntemi"
        value={tab}
        onChange={(value) => {
          setTab(value);
          setSelected(undefined);
          setMessage('');
        }}
        options={tabs}
      />
      <details className="card stack">
        <summary>Çiğ / pişmiş gramaj dönüştür</summary>
        <label className="field">
          Yiyecek
          <select value={conversionFood} onChange={(e) => setConversionFood(e.target.value)}>
            <option value="chicken">Tavuk göğüs</option>
            <option value="rice">Pirinç</option>
            <option value="pasta">Makarna</option>
            <option value="lentils">Mercimek</option>
          </select>
        </label>
        <div className="grid2">
          <label className="field">
            Tarttığım hâli
            <select
              value={conversionState}
              onChange={(e) => setConversionState(e.target.value as 'raw' | 'cooked')}
            >
              <option value="cooked">Pişmiş</option>
              <option value="raw">Çiğ</option>
            </select>
          </label>
          <label className="field">
            Ağırlık (g)
            <NumericInput
              min={0}
              value={conversionQty}
              onValueChange={(text) => setConversionQty(Math.max(0, +text))}
              aria-label={'Ağırlık (g)'}
            />
          </label>
        </div>
        <p className="notice">
          Yaklaşık {Math.round(convertWeight(conversionQty, conversionFood, conversionState))} g{' '}
          {conversionState === 'raw' ? 'pişmiş' : 'çiğ'} karşılığı. Pişirme yöntemine göre değişir;
          kalori kaydı için tarttığın hâlin yiyecek kaydını seç.
        </p>
      </details>
      {selected && tab !== 'recipes' ? (
        <>
          <Button variant="quiet" onClick={() => setSelected(undefined)}>
            ← Aramaya dön
          </Button>
          <h3>{selected.name}</h3>
          <fieldset>
            <legend>Yiyeceğin hâli</legend>
            <div className="choice-grid">
              {(selected.state === 'na' ? ['na'] : ['raw', 'cooked']).map((s) => (
                <button
                  key={s}
                  className="choice"
                  aria-pressed={state === s}
                  onClick={() => {
                    if (s !== selected.state) {
                      const variant = data.food.find(
                        (f) =>
                          f.state === s &&
                          f.aliases.some((alias) => selected.aliases.includes(alias)),
                      );
                      if (variant) {
                        setSelected(variant);
                        setState(s as FoodState);
                      } else setMessage('Bu hâl için ayrı yiyecek kaydı seç.');
                    } else setState(s as FoodState);
                  }}
                >
                  {s === 'raw' ? 'Çiğ' : s === 'cooked' ? 'Pişmiş' : 'Tüketime hazır'}
                </button>
              ))}
            </div>
          </fieldset>
          <Stepper
            value={qty}
            onChange={setQty}
            label={`Miktar (${selected.unit})`}
            min={selected.unit === 'adet' ? 0.25 : 1}
            max={10000}
            step={selected.unit === 'adet' ? 0.5 : 10}
          />
          <div className="choice-grid">
            {selected.portions.map((p) => (
              <Button key={p.label} variant="secondary" onClick={() => setQty(p.qty)}>
                {p.label} · {p.qty} {selected.unit}
              </Button>
            ))}
          </div>
          <div className="choice-grid">
            {[
              ['Küçük', 0.75],
              ['Orta', 1],
              ['Büyük', 1.5],
            ].map(([label, factor]) => (
              <Button
                key={label}
                variant="secondary"
                onClick={() =>
                  setQty(
                    (selected.portions.find((p) => p.label.includes('porsiyon'))?.qty ||
                      selected.portions[0]?.qty ||
                      selected.per) * Number(factor),
                  )
                }
              >
                {label} porsiyon
              </Button>
            ))}
          </div>
          <Card className="macro-preview">
            <b>{Math.round(macros!.kcal)} kcal</b>
            <span>{macros!.protein.toFixed(1)} g protein</span>
            {macros!.carb !== undefined && (
              <span>
                {macros!.carb.toFixed(1)} g karbonhidrat · {macros!.fat?.toFixed(1)} g yağ
              </span>
            )}
          </Card>
          {selected.id.includes('tavuk') && state !== 'na' && state !== '' && (
            <p className="notice">
              Yaklaşık {Math.round(convertWeight(qty, 'chicken', state))} g{' '}
              {state === 'cooked' ? 'çiğ' : 'pişmiş'} karşılığı · pişirme yöntemine göre değişir.
            </p>
          )}
          <p className="source-label">{selected.source}</p>
          <p className="source-label">Kaynak kimliği: {selected.sourceId || selected.id}</p>
          {selected.recipeId && (
            <details>
              <summary>Tarif malzemeleri ve porsiyon hesabı</summary>
              {data.recipe
                .filter((r) => r.id === selected.recipeId)
                .map((r) => (
                  <div className="stack" key={r.id}>
                    <p className="small muted">
                      Örnek tarif; bitmiş ağırlık {r.cookedWeightG} g. Kendi tarifini tartarak daha
                      doğru sonuç alabilirsin.
                    </p>
                    <ul>
                      {r.ingredients.map((i) => (
                        <li key={i.foodId}>
                          {data.food.find((f) => f.id === i.foodId)?.name} · {i.qty} g
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </details>
          )}
          <Button
            onClick={() => {
              if (selected.id.startsWith('off-'))
                mutate((v) => ({
                  food: [...v.food.filter((f) => f.id !== selected.id), selected],
                }));
              addSelected();
            }}
            disabled={!state || qty <= 0}
          >
            Öğüne ekle
            <Check size={17} />
          </Button>
        </>
      ) : (
        <>
          {(tab === 'search' || tab === 'photo' || tab === 'recipes' || tab === 'packaged') && (
            <>
              <label className="field">
                {tab === 'packaged' ? 'Ürün adı veya barkod' : 'Yiyecek ara'}
                <div className="search-input">
                  <Search size={18} />
                  <input
                    placeholder={
                      tab === 'packaged'
                        ? 'Ürün adı veya 13 haneli barkod'
                        : 'Yumurta, yoğurt, pişmiş tavuk…'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tab === 'packaged') void searchRemote();
                    }}
                  />
                </div>
              </label>
              {tab === 'packaged' ? (
                <>
                  <p className="muted small">
                    Yalnızca bu aramayı başlattığında ürün adı veya barkod Open Food Facts'e
                    gönderilir.
                  </p>
                  {!online && (
                    <p className="notice">
                      Çevrimdışısın. Kayıtlı yiyeceklerini aramaya devam edebilirsin.
                    </p>
                  )}
                  <Button
                    disabled={!online || loading || !query.trim()}
                    onClick={() => void searchRemote()}
                  >
                    Paketli ürün ara
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!online || loading}
                    onClick={() => void scan()}
                  >
                    Barkodu kamerayla oku
                  </Button>
                  {foodList(products)}
                </>
              ) : (
                <>
                  {tab === 'photo' && (
                    <>
                      <label className="button secondary file-button">
                        <Camera size={18} /> Fotoğraf çek veya seç
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={loading}
                          onChange={(e) => {
                            if (e.target.files?.[0]) void upload(e.target.files[0]);
                          }}
                        />
                      </label>
                      <p className="muted small">
                        Fotoğraf anını saklar. Kalori ve protein, eklediğin yiyeceklerden
                        hesaplanır.
                      </p>
                      {photoIds.length > 0 && <Chip>{photoIds.length} fotoğraf eklendi</Chip>}
                      <Recognition
                        image={recognitionPhoto}
                        onChoose={(prediction, label) => {
                          const food = data.food.find(
                            (f) => f.id === FOOD_MATCHES[prediction.label],
                          );
                          if (food) choose(food);
                          else {
                            setQuery(label);
                            setTab('search');
                            setMessage('Öneriyi doğru yiyecekle eşleştir veya aramayı düzelt.');
                          }
                        }}
                      />
                    </>
                  )}
                  {tab === 'recipes' && (
                    <>
                      <label className="field">
                        Tarif adı
                        <input
                          value={recipeName}
                          onChange={(e) => setRecipeName(e.target.value)}
                          placeholder="Annemin kuru fasulyesi"
                        />
                      </label>
                      {recipeItems.map((item, i) => (
                        <div key={i} className="row">
                          <span className="grow">
                            {data.food.find((f) => f.id === item.foodId)?.name}
                          </span>
                          <NumericInput
                            className="compact-input"
                            min={1}
                            value={item.qty}
                            aria-label={`Malzeme ${i + 1} miktarı`}
                            max={100000}
                            onValueChange={(text) =>
                              setRecipeItems(
                                recipeItems.map((v, n) => (n === i ? { ...v, qty: +text } : v)),
                              )
                            }
                          />
                          <Button
                            variant="quiet"
                            aria-label={`Malzeme ${i + 1} sil`}
                            onClick={() => setRecipeItems(recipeItems.filter((_, n) => n !== i))}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                      <div className="grid2">
                        <label className="field">
                          Pişmiş toplam (g)
                          <NumericInput
                            min={1}
                            value={cookedWeight}
                            onValueChange={(text) => setCookedWeight(+text)}
                            aria-label={'Pişmiş toplam (g)'}
                            max={100000}
                          />
                        </label>
                        <label className="field">
                          Porsiyon sayısı
                          <NumericInput
                            min={1}
                            value={servings}
                            onValueChange={(text) => setServings(+text)}
                            aria-label={'Porsiyon sayısı'}
                            max={1000}
                          />
                        </label>
                      </div>
                      <label className="field">
                        Porsiyon adı
                        <input
                          value={portionName}
                          onChange={(e) => setPortionName(e.target.value)}
                          placeholder="1 kepçe"
                        />
                      </label>
                      <p className="muted small">
                        1 {portionName || 'porsiyon'} ={' '}
                        {servings > 0 ? Math.round(cookedWeight / servings) : 0} g
                      </p>
                      <Button
                        disabled={
                          !recipeName.trim() ||
                          !recipeItems.length ||
                          cookedWeight <= 0 ||
                          servings <= 0 ||
                          recipeItems.some((i) => i.qty <= 0)
                        }
                        onClick={saveRecipe}
                      >
                        Tarifi kaydet
                      </Button>
                      <p className="eyebrow">MALZEME SEÇ</p>
                    </>
                  )}
                  {foodList(results)}
                  {!results.length && (
                    <EmptyState title="Bu aramada eşleşme yok">
                      Daha kısa bir ad veya farklı bir yazım deneyebilirsin.
                    </EmptyState>
                  )}
                </>
              )}
            </>
          )}
          {tab === 'text' && (
            <>
              <label className="field">
                Ne yedin?
                <textarea
                  rows={3}
                  placeholder="2 yumurta, 1 dilim ekmek"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setRows([]);
                  }}
                />
              </label>
              <Button disabled={!text.trim()} onClick={() => setRows(parseMeal(text, data.food))}>
                Kalemlere ayır
              </Button>
              {rows.map((row, i) => (
                <Card key={i} className="stack">
                  <div className="row between">
                    <strong>{row.text}</strong>
                    <Button
                      variant="quiet"
                      aria-label={`${row.text} çıkar`}
                      onClick={() => setRows(rows.filter((_, n) => n !== i))}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  {row.issue && (
                    <>
                      <p className="notice">{row.issue}</p>
                      <label className="field">
                        Yiyeceği seç
                        <select
                          value={row.food?.id || ''}
                          onChange={(e) => {
                            const food = data.food.find((f) => f.id === e.target.value);
                            setRows(
                              rows.map((r, n) =>
                                n === i ? { ...r, food, state: food?.state, issue: undefined } : r,
                              ),
                            );
                          }}
                        >
                          <option value="">Eşleşme seç</option>
                          {data.food.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ·{' '}
                              {f.state === 'raw'
                                ? 'Çiğ'
                                : f.state === 'cooked'
                                  ? 'Pişmiş'
                                  : 'Hazır'}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  {row.food && (
                    <>
                      <Stepper
                        value={row.qty}
                        label={`Kalem ${i + 1} miktarı (${row.food.unit})`}
                        min={0.25}
                        max={10000}
                        step={row.food.unit === 'adet' ? 0.25 : 10}
                        onChange={(qty) =>
                          setRows(rows.map((r, n) => (n === i ? { ...r, qty } : r)))
                        }
                      />
                      <p>
                        {row.qty} {row.food.unit} · {Math.round(calculate(row.food, row.qty).kcal)}{' '}
                        kcal · {calculate(row.food, row.qty).protein.toFixed(1)} g protein
                      </p>
                      {row.issue && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setRows(rows.map((r, n) => (n === i ? { ...r, issue: undefined } : r)))
                          }
                        >
                          {row.food.state === 'raw'
                            ? 'Çiğ'
                            : row.food.state === 'cooked'
                              ? 'Pişmiş'
                              : 'Hazır'}{' '}
                          olarak doğrula
                        </Button>
                      )}
                    </>
                  )}
                </Card>
              ))}
              {rows.length > 0 && !rows.some((r) => !r.food || r.issue) && (
                <>
                  <Card className="macro-preview">
                    <b>{Math.round(total(rows.map((r) => calculate(r.food!, r.qty))).kcal)} kcal</b>
                    <span>
                      {total(rows.map((r) => calculate(r.food!, r.qty))).protein.toFixed(1)} g
                      protein
                    </span>
                  </Card>
                  <Button onClick={addParsed}>Tümünü öğüne ekle</Button>
                </>
              )}
            </>
          )}
          {tab === 'copy' && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  const yesterday = data.mealEntry.filter(
                    (e) => e.date === shiftDate(date, -1) && e.mealId === meal,
                  );
                  if (!yesterday.length) {
                    setMessage('Dün bu öğünde kayıt yok.');
                    return;
                  }
                  addMeals(
                    yesterday.map((e) => ({
                      ...e,
                      id: newId(),
                      date,
                      photoIds: [],
                      createdAt: Date.now(),
                    })),
                  );
                  onClose();
                }}
              >
                <Copy size={17} /> Dünkü{' '}
                {MEALS.find((m) => m.id === meal)?.name.toLocaleLowerCase('tr')} öğününü kopyala
              </Button>
              <Button
                onClick={() => {
                  const menu = data.menuPlan[0].days[weekday(date)][meal];
                  addMeals(
                    menu.items.map((i) =>
                      make(
                        data.food.find((f) => f.id === i.foodId)!,
                        i.qty,
                        i.state,
                      ),
                    ),
                  );
                  onClose();
                }}
              >
                Plandaki gibi yedim
              </Button>
            </>
          )}
        </>
      )}
      {loading && <p role="status">Birazdan hazır…</p>}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </Sheet>
  );
}
