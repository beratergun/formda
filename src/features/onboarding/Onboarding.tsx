import { useState } from 'react';
import { ProgramPicker } from '../plan/ProgramPicker';
import { selectProgram, type ProgramId } from '../../domain/program/programs';
import { ArrowRight, ArrowLeft, Check, LockKeyhole, Leaf, Camera } from 'lucide-react';
import { Button, Card, Chip, Sheet } from '../../ui';
import { CameraCapture } from '../camera/Camera';
import { useStore } from '../../app/Store';
import { defaultPlan } from '../../domain/program';
import { todayKey } from '../../domain/dates';
import type { Horizon } from '../../domain/types';
import { restoreBackup } from '../../data/backup';
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
    <div className="onboarding stack page-enter">
      <div className="row between">
        <span className="brand">
          <span className="brand-mark">
            <img src={import.meta.env.BASE_URL + 'icons/icon.svg'} width="28" height="28" alt="" />
          </span>
          Formda<span className="brand-dot">/</span>
        </span>
        <Chip>{step + 1} / 4</Chip>
      </div>
      <div className="onboarding-dots" role="img" aria-label={`Adım ${step + 1}/4`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= step ? 'filled' : ''} />
        ))}
      </div>
      {step === 0 && (
        <>
          <div className="welcome-art">
            <svg viewBox="0 0 300 220" aria-hidden="true">
              <path
                d="M45 196c-12-68 110-31 85-85S204 54 253 25"
                fill="none"
                stroke="currentColor"
                strokeWidth="34"
                strokeLinecap="round"
                opacity=".12"
              />
              <path
                d="M45 196c-12-68 110-31 85-85S204 54 253 25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 8"
              />
              <circle cx="45" cy="196" r="10" fill="currentColor" />
              <path d="m247 18 15 5-9 13" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="160" cy="86" r="15" fill="#d7e9a2" />
              <path
                d="m159 103-8 35 25 24m-25-24-18 31m23-58 25 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
            <span className="art-badge">
              <Leaf size={16} /> Küçük adımlar, sana ait bir yol.
            </span>
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
                <input
                  type="number"
                  min={1}
                  value={kcal}
                  onChange={(e) => setKcal(+e.target.value)}
                />
              </label>
              <label className="field">
                Protein hedefi (g)
                <input
                  type="number"
                  min={1}
                  value={protein}
                  onChange={(e) => setProtein(+e.target.value)}
                />
              </label>
            </div>
            {kcal < 1500 && <p className="notice">Bu hedefi hekim/diyetisyeninle netleştir.</p>}
            <div className="grid2">
              <label className="field">
                Başlangıç kilosu (kg)
                <input
                  type="number"
                  min={30}
                  max={400}
                  value={weight}
                  onChange={(e) => setWeight(+e.target.value)}
                />
              </label>
              <label className="field">
                Hedef kilo (kg)
                <input
                  type="number"
                  min={30}
                  max={400}
                  value={goal}
                  onChange={(e) => setGoal(+e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              Boy (cm)
              <input
                type="number"
                min={100}
                max={250}
                value={height}
                onChange={(e) => setHeight(+e.target.value)}
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
            <ProgramPicker
              settings={{ ...defaultPlan(start, days, equipment, experience), programId }}
              onChange={(next) => {
                setProgramId(next.programId as ProgramId);
                setDays(next.daysPerWeek);
              }}
            />
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
              <CameraCapture
                onSaved={() => {
                  setPhotoCount((n) => n + 1);
                  setPhotoOpen(false);
                }}
              />
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
              void restoreBackup(file, 'replace')
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
