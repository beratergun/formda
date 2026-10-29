import { useEffect, useState } from 'react';
import {
  Database,
  Download,
  HardDrive,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useStore } from '../../app/Store';
import { APP_NAME, APP_VERSION } from '../../app/config';
import { Button, Card, Chip, Sheet } from '../../ui';
import { createBackup, restoreBackup, resetDatabase } from '../../data/backup';
import { clearAllData, storageInfo } from '../../data/media/opfs';
import { seedDatabase } from '../../data/db';
import { repository } from '../../data/repositories';
import { demoData, createDemoPhotos } from '../../data/demo';
import { DEFAULT_WEIGHTS } from '../../domain/score';
import { createIcs } from '../../domain/ics';
import { importLegacy } from '../../domain/legacyImport';
import { pinHash } from '../../domain/privacy';
import { dateDiff, dateLabel, shiftDate, todayKey } from '../../domain/dates';
import { downloadBlob } from '../../data/media/export';
import type { Profile as UserProfile } from '../../domain/types';
import { InstallCard } from '../../app/InstallCard';

const mb = (n: number) =>
  `${(n / 1024 / 1024).toLocaleString('tr', { maximumFractionDigits: 1 })} MB`;
export function Profile() {
  const { data, mutate, flush, reload, setError } = useStore();
  const [profile, setProfile] = useState<UserProfile>(data.profile[0]);
  const [space, setSpace] = useState<Awaited<ReturnType<typeof storageInfo>>>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pin, setPin] = useState('');
  const [pinAgain, setPinAgain] = useState('');
  const [confirm, setConfirm] = useState<'delete' | 'demo' | 'clearDemo'>();
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [icsStart, setIcsStart] = useState(todayKey);
  const [icsEnd, setIcsEnd] = useState(shiftDate(todayKey(), 182));
  const [legacy, setLegacy] = useState<ReturnType<typeof importLegacy>>();
  const [weights, setWeights] = useState(data.targets[0].scoreWeights || DEFAULT_WEIGHTS);
  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'desteklenmiyor',
  );
  useEffect(() => {
    void storageInfo().then(setSpace).catch(() => setError('Depolama bilgisi okunamadı.'));
  }, [setError]);
  const action = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await flush();
      await task();
      await reload();
      setSpace(await storageInfo());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  const saveProfile = () => {
    if (
      profile.heightCm < 100 ||
      profile.heightCm > 250 ||
      profile.startWeight < 30 ||
      profile.startWeight > 400 ||
      profile.activityFactor < 1 ||
      profile.activityFactor > 2.5
    ) {
      setError('Boy, kilo ve aktivite değerlerini kontrol et.');
      return;
    }
    mutate(v => ({ profile: [{ ...v.profile[0], name: profile.name, age: profile.age, sex: profile.sex, heightCm: profile.heightCm, startWeight: profile.startWeight, activityFactor: profile.activityFactor }] }));
    setMessage('Profilin kaydedildi.');
  };
  const backup = () =>
    action(async () => {
      const blob = await createBackup();
      downloadBlob(blob, `yol-tam-yedek-${todayKey()}.zip`);
      setMessage('Tam yedeğin cihaza indiriliyor.');
    });
  const setNewPin = () =>
    action(async () => {
      const salt = crypto.randomUUID();
      const hash = await pinHash(pin, salt);
      mutate((v) => ({ profile: [{ ...v.profile[0], pinHash: hash, pinSalt: salt }] }));
      await flush();
      setPin('');
      setPinAgain('');
    });
  const csv = () => {
    const rows = [
      ['tarih', 'öğün', 'yiyecek', 'miktar', 'birim', 'hal', 'kcal', 'protein'],
      ...data.mealEntry.map((m) => [
        m.date,
        m.mealId,
        m.name,
        m.qty,
        m.unit,
        m.state,
        m.kcal,
        m.protein,
      ]),
    ];
    const safe = (value: unknown) => {
      let text = String(value);
      if (/^[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    downloadBlob(
      new Blob(['\ufeff' + rows.map((row) => row.map(safe).join(';')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
      `yol-beslenme-${todayKey()}.csv`,
    );
  };
  const notify = async () => {
    if (typeof Notification === 'undefined') {
      setMessage('Bu cihazda uygulama içi bildirim desteklenmiyor. Takvime aktarabilirsin.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    mutate((v) => ({ profile: [{ ...v.profile[0], notifications: permission === 'granted' }] }));
  };
  const confirmAction = () =>
    action(async () => {
      if (confirm === 'delete' || confirm === 'clearDemo') {
        await resetDatabase();
        setProfile((await repository.load()).profile[0]);
        setConfirm(undefined);
      } else if (confirm === 'demo') {
        await clearAllData();
        await seedDatabase();
        const next = demoData(await repository.load());
        await repository.replace(next);
        await createDemoPhotos();
        setProfile(next.profile[0]);
        setConfirm(undefined);
      }
    });
  const lastBackup = data.meta.find((m) => m.key === 'lastBackupAt')?.value;
  const backupDue = !lastBackup || dateDiff(todayKey(), lastBackup.slice(0, 10)) >= 7;
  return (
    <div className="stack page-enter">
      <div>
        <p className="eyebrow">SENİN ALANIN</p>
        <h1>Yol, sana göre.</h1>
        <p className="muted">Tercihlerin, gizliliğin ve cihazındaki veriler.</p>
      </div>
      <InstallCard force />
      <Card className="stack">
        <div className="row">
          <span className="avatar">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2>Hesap yok. Sunucu yok.</h2>
            <p className="muted small">Kaydettiklerin yalnızca bu cihazda.</p>
          </div>
        </div>
      </Card>
      <Card className="stack">
        <h2>Senin bilgilerin</h2>
        <label className="field">
          Adın
          <input
            value={profile.name || ''}
            maxLength={40}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </label>
        <div className="grid2">
          <label className="field">
            Yaş
            <input
              type="number"
              min={18}
              max={100}
              value={profile.age || ''}
              onChange={(e) => setProfile({ ...profile, age: +e.target.value || undefined })}
            />
          </label>
          <label className="field">
            Hesap için cinsiyet
            <select
              value={profile.sex || 'unspecified'}
              onChange={(e) =>
                setProfile({ ...profile, sex: e.target.value as UserProfile['sex'] })
              }
            >
              <option value="unspecified">Belirtme</option>
              <option value="female">Kadın</option>
              <option value="male">Erkek</option>
            </select>
          </label>
          <label className="field">
            Boy (cm)
            <input
              type="number"
              min={100}
              max={250}
              value={profile.heightCm}
              onChange={(e) => setProfile({ ...profile, heightCm: +e.target.value })}
            />
          </label>
          <label className="field">
            Başlangıç kilosu (kg)
            <input
              type="number"
              min={30}
              max={400}
              step={0.1}
              value={profile.startWeight}
              onChange={(e) => setProfile({ ...profile, startWeight: +e.target.value })}
            />
          </label>
        </div>
        <label className="field">
          Aktivite katsayısı
          <input
            type="number"
            min={1}
            max={2.5}
            step={0.05}
            value={profile.activityFactor}
            onChange={(e) => setProfile({ ...profile, activityFactor: +e.target.value })}
          />
        </label>
        <Button onClick={saveProfile}>Profilimi kaydet</Button>
      </Card>
      <Card className="stack">
        <h2>Görünüm ve hatırlatmalar</h2>
        <label className="field">
          Tema
          <select
            defaultValue={localStorage.getItem('yol-theme') || 'system'}
            onChange={(e) => {
              localStorage.setItem('yol-theme', e.target.value);
              if (e.target.value === 'system') delete document.documentElement.dataset.theme;
              else document.documentElement.dataset.theme = e.target.value;
              window.dispatchEvent(new Event('yol-theme-change'));
            }}
          >
            <option value="system">Cihazı izle</option>
            <option value="light">Açık</option>
            <option value="dark">Koyu</option>
          </select>
        </label>
        <label className="field">
          Fotoğraf hatırlatma aralığı (gün)
          <input
            type="number"
            min={1}
            max={90}
            value={data.profile[0].photoReminderDays}
            onChange={(e) => {
              const days = +e.target.value;
              if (days >= 1 && days <= 90)
                mutate((v) => ({ profile: [{ ...v.profile[0], photoReminderDays: days }] }));
            }}
          />
        </label>
        <p className="muted small">
          Bildirim izni:{' '}
          {notificationStatus === 'granted'
            ? 'Açık'
            : notificationStatus === 'denied'
              ? 'Kapalı'
              : 'Henüz verilmedi'}
          . Hatırlatmalar uygulama açıkken çalışır; kapalıyken takvimini kullanabilirsin.
        </p>
        <Button variant="secondary" onClick={() => void notify()}>
          Hatırlatmalara izin ver
        </Button>
      </Card>
      <Card className="stack">
        <div className="row">
          <LockKeyhole size={20} className="accent" />
          <h2>Gizlilik</h2>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!data.profile[0].hidePhotos}
            onChange={(e) => {
              const hidePhotos = e.target.checked;
              mutate((v) => ({ profile: [{ ...v.profile[0], hidePhotos }] }));
            }}
          />
          Fotoğraf ve vlog küçük resimlerini gizle
        </label>
        {data.profile[0].pinHash ? (
          <>
            <Chip>Uygulama kilidi açık</Chip>
            <Button
              variant="secondary"
              onClick={() =>
                mutate((v) => ({
                  profile: [{ ...v.profile[0], pinHash: undefined, pinSalt: undefined }],
                }))
              }
            >
              PIN kilidini kaldır
            </Button>
          </>
        ) : (
          <>
            <div className="grid2">
              <label className="field">
                Yeni PIN
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <label className="field">
                PIN tekrar
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinAgain}
                  onChange={(e) => setPinAgain(e.target.value.replace(/\D/g, ''))}
                />
              </label>
            </div>
            <Button
              variant="secondary"
              disabled={busy || pin.length !== 4 || pin !== pinAgain}
              onClick={() => void setNewPin()}
            >
              Uygulama kilidini aç
            </Button>
            <p className="muted small">
              PIN'i unutursan uygulama içinden sıfırlanamaz. Güvenli bir yerde tut. Bu kilit, cihaz
              şifrelemesinin yerine geçmez.
            </p>
          </>
        )}
      </Card>
      <Card className="stack">
        <h2>Gün puanının ağırlıkları</h2>
        {['Kutular', 'Protein', 'Kalori', 'Hareket', 'Su', 'Uyku'].map((label, i) => (
          <label className="field" key={label}>
            {label}
            <input
              type="number"
              min={0}
              max={100}
              value={weights[i]}
              onChange={(e) =>
                setWeights(
                  weights.map((n, index) => (index === i ? Math.max(0, +e.target.value) : n)),
                )
              }
            />
          </label>
        ))}
        <Button
          variant="secondary"
          disabled={!weights.some((n) => n > 0)}
          onClick={() => mutate((v) => ({ targets: [{ ...v.targets[0], scoreWeights: weights }] }))}
        >
          Puan ağırlıklarını kaydet
        </Button>
      </Card>
      <Card className="stack">
        <div className="row">
          <HardDrive size={20} />
          <h2>Cihazındaki alan</h2>
        </div>
        {space && (
          <>
            <div className="stats-grid">
              <div>
                <b>{mb(space.photo)}</b>
                <small>fotoğraf</small>
              </div>
              <div>
                <b>{mb(space.video)}</b>
                <small>video</small>
              </div>
              <div>
                <b>{mb(Math.max(0, space.usage - space.photo - space.video))}</b>
                <small>diğer veri</small>
              </div>
            </div>
            <p className="muted small">
              Toplam {mb(space.usage)}
              {space.quota ? ` / yaklaşık ${mb(space.quota)} kullanılabilir kota` : ''}
            </p>
            {space.nearLimit && (
              <p className="notice">
                Depolama alanı azalıyor. Eski videoları dışa aktarabilir veya silebilirsin.
              </p>
            )}
          </>
        )}
        <Button
          variant="secondary"
          onClick={() =>
            void navigator.storage
              ?.persist?.()
              .then((ok) =>
                setMessage(
                  ok
                    ? 'Kalıcı depolama izni verildi.'
                    : 'Tarayıcı kalıcı depolama izni vermedi. Düzenli yedek alabilirsin.',
                ),
              )
          }
        >
          Kalıcı depolama iste
        </Button>
      </Card>
      <Card className="stack">
        <div className="row">
          <Database size={20} />
          <h2>Verilerin yanında olsun.</h2>
        </div>
        {backupDue && <p className="notice">Bu hafta tam yedek almayı hatırla.</p>}
        <p className="muted small">
          Son tam yedek: {lastBackup ? dateLabel(lastBackup.slice(0, 10)) : 'Henüz alınmadı'}
        </p>
        <Button disabled={busy} onClick={() => void backup()}>
          <Download size={17} />
          Tam yedek al
        </Button>
        <label className="field">
          Geri yükleme yöntemi
          <select
            value={restoreMode}
            disabled={busy}
            onChange={(e) => setRestoreMode(e.target.value as 'merge' | 'replace')}
          >
            <option value="merge">Kayıtları birleştir</option>
            <option value="replace">Mevcut kayıtların üzerine yaz</option>
          </select>
        </label>
        <label className="button secondary file-button">
          <Upload size={17} />
          Tam yedeği geri yükle
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void action(async () => {
                  await restoreBackup(file, restoreMode);
                  setMessage('Veri ve medya geri yüklendi.');
                });
            }}
          />
        </label>
        <Button variant="secondary" onClick={csv}>
          Beslenmeyi CSV indir
        </Button>
        <label className="button secondary file-button">
          <RefreshCw size={17} />
          Eski prototip JSON'unu seç
          <input
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void action(async () => {
                  const parsed = importLegacy(JSON.parse(await file.text()), data);
                  setLegacy(parsed);
                });
            }}
          />
        </label>
        <Button variant="danger" disabled={busy} onClick={() => setConfirm('delete')}>
          Tüm verilerimi sil
        </Button>
      </Card>
      <Card className="stack">
        <h2>Takvimin de yanında.</h2>
        <div className="grid2">
          <label className="field">
            Takvim başlangıcı
            <input type="date" value={icsStart} onChange={(e) => setIcsStart(e.target.value)} />
          </label>
          <label className="field">
            Takvim bitişi
            <input type="date" value={icsEnd} onChange={(e) => setIcsEnd(e.target.value)} />
          </label>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            try {
              downloadBlob(
                new Blob([createIcs(data.planSettings[0], icsStart, icsEnd)], {
                  type: 'text/calendar;charset=utf-8',
                }),
                'yol-plan.ics',
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Takvim hazırlanamadı.');
            }
          }}
        >
          Planı takvime aktar (.ics)
        </Button>
      </Card>
      <Card className="stack">
        <h2>Uygulamayı keşfet</h2>
        <p className="muted small">Demo kayıtları ve çizilmiş silüetler tamamen kurgusaldır.</p>
        <Button variant="secondary" disabled={busy} onClick={() => setConfirm('demo')}>
          Demo verisi yükle
        </Button>
        {data.meta.some((m) => m.key === 'demoData') && (
          <Button variant="quiet" onClick={() => setConfirm('clearDemo')}>
            Demo verisini temizle
          </Button>
        )}
      </Card>
      <Card className="stack">
        <div className="row between">
          <h2>{APP_NAME}</h2>
          <Chip>v{APP_VERSION}</Chip>
        </div>
        <p className="muted">
          Her gün kendine bir adım. Cihazında çalışan kişisel spor asistanı ve günlüğü.
        </p>
        <p className="source-label">
          Besin kaynakları: referans menü (yaklaşık), USDA FoodData Central SR Legacy 2018 ve açıkça
          aradığın Open Food Facts ürünleri.
        </p>
      </Card>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {busy && (
        <p className="processing-toast" role="status">
          Verilerin cihazında işleniyor…
        </p>
      )}
      {confirm && (
        <Sheet
          title={confirm === 'demo' ? 'Kurgusal demo yükle' : 'Kayıtları sil'}
          onClose={() => setConfirm(undefined)}
        >
          <p>
            {confirm === 'demo'
              ? 'Demo verisi mevcut kayıtların yerini alır. Gerçek kayıtların varsa önce tam yedek indir.'
              : 'Bu cihazdaki kayıtlar ve medya silinecek. Tam yedeğin varsa sonradan geri yükleyebilirsin.'}
          </p>
          <Button variant="secondary" onClick={() => void backup()}>
            Önce tam yedek al
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void confirmAction()}>
            {confirm === 'demo' ? 'Evet, demo verisini yükle' : 'Evet, tüm kayıtları sil'}
          </Button>
          <Button variant="quiet" onClick={() => setConfirm(undefined)}>
            Vazgeç
          </Button>
        </Sheet>
      )}
      {legacy && (
        <Sheet title="Eski kayıtlarını aktar" onClose={() => setLegacy(undefined)}>
          <p>
            {legacy.dayLog.length} gün, {legacy.mealEntry.length} öğün kalemi,{' '}
            {legacy.workoutLog.length} seans aktarılmaya hazır. Aynı tarihteki kayıtlar güncellenir;
            medya bu JSON'da bulunmaz.
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await repository.replace(legacy);
                setLegacy(undefined);
                setMessage('Eski kayıtların aktarıldı.');
              })
            }
          >
            Kayıtları aktar
          </Button>
        </Sheet>
      )}
    </div>
  );
}
