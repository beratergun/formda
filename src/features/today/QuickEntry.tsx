import { useState } from 'react';
import { useStore } from '../../app/Store';
import { emptyDay } from '../../domain/types';
import { Button, Sheet } from '../../ui';
import { WeightLogSheet } from './WeightLogSheet';
export function QuickEntry({ kind, onClose }: { kind: 'weight' | 'note'; onClose: () => void }) {
  return kind === 'weight' ? <WeightLogSheet onClose={onClose} /> : <NoteEntry onClose={onClose} />;
}
function NoteEntry({ onClose }: { onClose: () => void }) {
  const { data, date, updateDay, flush } = useStore();
  const day = data.dayLog.find((d) => d.date === date) || emptyDay(date);
  const [note, setNote] = useState(day.note || '');
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="Bugünden bir not" onClose={onClose}>
      <label className="field">
        Notun
        <textarea
          aria-label="Notun"
          autoFocus
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <Button
        disabled={busy}
        onClick={() => {
          setBusy(true);
          updateDay({ note });
          void flush()
            .then(onClose)
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      >
        Kaydet
      </Button>
    </Sheet>
  );
}
