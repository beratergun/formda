import { lazy, Suspense, useState } from 'react';
const ProgramPicker = lazy(() =>
  import('../plan/ProgramPicker').then((m) => ({ default: m.InitialProgramPicker })),
);
import type { ProgramId } from '../../domain/program/programs';
import { ArrowRight, ArrowLeft, Check, LockKeyhole, Camera } from 'lucide-react';
import { NumericInput, Button, Card, Chip, Sheet } from '../../ui';
const CameraCapture = lazy(() =>
  import('../camera/Camera').then((m) => ({ default: m.CameraCapture })),
);
import { useStore } from '../../app/Store';
import { todayKey } from '../../domain/today';
import { defaultPlan } from '../../domain/program/defaultPlan';
import type { Horizon } from '../../domain/types';
import { InstallCard } from '../../app/InstallCard';
export function Onboarding() {
  const { data, mutate, flush, setError, reload } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [start, setStart] = useState(todayKey);
  const [horizon, setHorizon] = useState<Horizon>('6m');
  const [programId, setProgramId] = useState<ProgramId>('personal');
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState(['salon', 'havuz']);
  const [experience, setExperience] = useState('beginner');
  const [kcal, setKcal] = useState(data.targets[0].kcal);
  const [protein, setProtein] = useState(data.targets[0].protein);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(170);
  const [goal, setGoal] = useState(75);
  const [busy, setBusy] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const finish = async () => {
    setBusy(true);
    try {
      const { selectProgram } = await import('../../domain/program/programs');
      mutate((value) => ({
        profile: [
          { ...value.profile[0], name: name.trim(), heightCm: height, startWeight: weight },
        ],
        targets: [{ ...value.targets[0], kcal, protein, goalWeight: goal }],
        planSettings: [
          {
            ...selectProgram(defaultPlan(start, days, equipment, experience), programId, days),
            horizon,
            experience,
          },
        ],
        meta: [
          ...value.meta.filter((m) => m.key !== 'onboardingDone'),
          { key: 'onboardingDone', value: 'true' },
        ],
      }));
      await flush();
      void navigator.storage?.persist?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div data-validation-scope className="onboarding stack">
      <div className="row between">
        {step > 0 ? (
          <span className="brand-plaque">
            <img
              src={import.meta.env.BASE_URL + 'brand/berxfit-240.webp'}
              srcSet={
                import.meta.env.BASE_URL +
                'brand/berxfit-240.webp 240w, ' +
                import.meta.env.BASE_URL +
                'brand/berxfit-360.webp 360w'
              }
              sizes="134px"
              width="134"
              height="70"
              alt="berXfit"
            />
          </span>
        ) : (
          <span className="eyebrow">SANA AİT. CİHAZINDA.</span>
        )}
        <Chip>{step + 1} / 4</Chip>
      </div>
      <div className="onboarding-dots" role="img" aria-label={`Adım ${step + 1}/4`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= step ? 'filled' : ''} />
        ))}
      </div>
      {step === 0 && (
        <>
          <div className="welcome-brand">
            <img
              src={import.meta.env.BASE_URL + 'brand/berxfit-welcome-500.webp'}
              srcSet={
                import.meta.env.BASE_URL +
                'brand/berxfit-welcome-500.webp 500w, ' +
                import.meta.env.BASE_URL +
                'brand/berxfit-welcome-680.webp 680w'
              }
              sizes="(max-width: 376px) calc(100vw - 96px), 280px"
              fetchPriority="high"
              width="1190"
              height="623"
              alt="berXfit — kişisel spor ve beslenme koçun"
            />
          </div>
          <div>
            <p className="eyebrow">KİŞİSEL SPOR VE BESLENME KOÇUN</p>
            <h1>
              İyi ki geldin.
              <br />
              Bu yol senin<span className="accent">.</span>
            </h1>
            <p className="muted">
              Öğünlerini, hareketini ve nasıl hissettiğini bir araya getir. Kendi ritminde ilerle.
            </p>
          </div>
          <label className="field">
            Sana nasıl seslenelim?
            <input
              placeholder="Adın (isteğe bağlı)"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="row privacy-line">
            <LockKeyhole size={16} />
            <span>Hesap yok. Verilerin yalnızca cihazında.</span>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <div>
            <p className="eyebrow">ÖNÜNDEKİ YOL</p>
            <h1>
              Hedeflerin,
              <br />
              senin seçimin.
            </h1>
            <p className="muted">Bunları dilediğin zaman değiştirebilirsin.</p>
          </div>
          <Card className="stack">
            <label className="field">
              Başlangıç tarihi
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="field">
              Plan ufku
              <select value={horizon} onChange={(e) => setHorizon(e.target.value as Horizon)}>
                <option value="6m">6 ay</option>
                <option value="1y">1 yıl</option>
                <option value="3y">3 yıl</option>
                <option value="5y">5 yıl</option>
                <option value="forever">Süresiz</option>
              </select>
            </label>
            <div className="grid2">
              <label className="field">
                Kalori hedefi
                <NumericInput
                  min={1}
                  value={kcal}
                  onValueChange={(text) => setKcal(+text)}
                  aria-label={'Kalori hedefi'}
                  max={20000}
                />
              </label>
              <label className="field">
                Protein hedefi (g)
                <NumericInput
                  min={1}
                  value={protein}
                  onValueChange={(text) => setProtein(+text)}
                  aria-label={'Protein hedefi (g)'}
                  max={1000}
                />
              </label>
            </div>
            {kcal < 1500 && <p className="notice">Bu hedefi hekim/diyetisyeninle netleştir.</p>}
            <div className="grid2">
              <label className="field">
                Başlangıç kilosu (kg)
                <NumericInput
                  min={30}
                  max={400}
                  value={weight}
                  onValueChange={(text) => setWeight(+text)}
                  aria-label={'Başlangıç kilosu (kg)'}
                />
              </label>
              <label className="field">
                Hedef kilo (kg)
                <NumericInput
                  min={30}
                  max={400}
                  value={goal}
                  onValueChange={(text) => setGoal(+text)}
                  aria-label={'Hedef kilo (kg)'}
                />
              </label>
            </div>
            <label className="field">
              Boy (cm)
              <NumericInput
                min={100}
                max={250}
                value={height}
                onValueChange={(text) => setHeight(+text)}
                aria-label={'Boy (cm)'}
              />
            </label>
          </Card>
        </>
      )}
      {step === 2 && (
        <>
          <div>
            <p className="eyebrow">SANA UYAN BİR DÜZEN</p>
            <h1>
              Hareketin
              <br />
              hayatına uysun.
            </h1>
          </div>
          <Card className="stack">
            <Suspense fallback={<p role="status">Programlar hazırlanıyor…</p>}>
              <ProgramPicker
                start={start}
                days={days}
                equipment={equipment}
                experience={experience}
                programId={programId}
                onChange={(next) => {
                  setProgramId(next.programId as ProgramId);
                  setDays(next.daysPerWeek);
                }}
              />
            </Suspense>
            <fieldset>
              <legend>Nerede hareket edeceksin?</legend>
              <div className="choice-grid">
                {[
                  ['salon', 'Spor salonu'],
                  ['ev', 'Ev'],
                  ['havuz', 'Havuz'],
                ].map(([id, title]) => (
                  <button
                    type="button"
                    key={id}
                    className="choice"
                    aria-pressed={equipment.includes(id)}
                    onClick={() =>
                      setEquipment((value) =>
                        value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
                      )
                    }
                  >
                    {equipment.includes(id) && <Check size={16} />} {title}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="field">
              Deneyimin
              <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="beginner">Yeni başlıyorum</option>
                <option value="returning">Bir aradan sonra dönüyorum</option>
                <option value="experienced">Düzenli hareket ediyorum</option>
              </select>
            </label>
          </Card>
          <p className="muted">
            Üç hafta yüklenme, bir hafif hafta. Her 12 haftada kendine dönüp bakacağın bir
            değerlendirme.
          </p>
        </>
      )}
      {step === 3 && (
        <>
          <div className="photo-welcome">
            <Camera size={56} strokeWidth={1} />
          </div>
          <div>
            <p className="eyebrow">BUGÜNDEN BİR ANI</p>
            <h1>
              Başlangıcını
              <br />
              hatırlamak ister misin?
            </h1>
            <p className="muted">
              Ön, yan ve arka fotoğraflarını İlerleme bölümünden ekleyebilirsin. Hepsi cihazında
              kalır.
            </p>
          </div>
          <Card>
            <div className="row">
              <LockKeyhole size={22} className="accent" />
              <p>Fotoğraf eklemek senin seçimin. Şimdi atlayıp daha sonra dönebilirsin.</p>
            </div>
          </Card>
          <Button variant="secondary" onClick={() => setPhotoOpen(true)}>
            <Camera size={18} />
            Başlangıç fotoğrafını çek
          </Button>
          {photoCount > 0 && <Chip>{photoCount} fotoğraf cihazına kaydedildi</Chip>}
          {photoOpen && (
            <Sheet title="Başlangıç fotoğrafın" onClose={() => setPhotoOpen(false)}>
              <Suspense fallback={<p role="status">Kamera hazırlanıyor…</p>}>
                <CameraCapture
                  onSaved={() => {
                    setPhotoCount((n) => n + 1);
                    setPhotoOpen(false);
                  }}
                />
              </Suspense>
            </Sheet>
          )}
        </>
      )}
      <div className="onboarding-actions row">
        {step > 0 && (
          <Button variant="secondary" aria-label="Önceki adım" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} />
          </Button>
        )}
        {step < 3 ? (
          <Button
            className="grow"
            disabled={
              (step === 1 &&
                (!start ||
                  kcal <= 0 ||
                  protein <= 0 ||
                  weight < 30 ||
                  goal < 30 ||
                  height < 100)) ||
              (step === 2 && !equipment.length)
            }
            onClick={() => setStep(step + 1)}
          >
            {step === 0 ? 'Yolculuğuma başla' : 'Devam et'}
            <ArrowRight size={18} />
          </Button>
        ) : (
          <Button className="grow" disabled={busy} onClick={() => void finish()}>
            {photoCount ? 'Kaydet ve başla' : 'Şimdilik atla ve başla'}
            <ArrowRight size={18} />
          </Button>
        )}
      </div>
      {step === 0 && (
        <label className="button quiet file-button">
          Yedeğimden devam et
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              void import('../../data/backup')
                .then(({ restoreBackup }) => restoreBackup(file, 'replace'))
                .then(reload)
                .catch((error) =>
                  setError(error instanceof Error ? error.message : 'Yedek açılamadı.'),
                )
                .finally(() => setBusy(false));
            }}
          />
        </label>
      )}
      {step === 0 && <InstallCard />}
    </div>
  );
}
