import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { LockKeyhole } from 'lucide-react';
import { db } from '../data/db';
import { useStore } from '../app/Store';
import { dateLabel } from '../domain/dates';
import type { MediaRecord } from '../domain/types';
export function useMedia(date?: string) {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  useEffect(() => {
    const sub = liveQuery(() =>
      date ? db.media.where('date').equals(date).toArray() : db.media.toArray(),
    ).subscribe({ next: setMedia });
    return () => sub.unsubscribe();
  }, [date]);
  return media;
}
export function useBlobUrl(blob?: Blob) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
export function MediaThumb({ record, onClick }: { record: MediaRecord; onClick?: () => void }) {
  const url = useBlobUrl(record.thumb);
  const hidden = useStore().data.profile[0].hidePhotos;
  return (
    <button
      type="button"
      className="media-thumb"
      onClick={onClick}
      aria-label={`${record.kind === 'vlog' ? 'Vlog' : 'Fotoğraf'} · ${dateLabel(record.date)}`}
    >
      {hidden ? (
        <LockKeyhole size={25} aria-label="Anı küçük resmi gizli" />
      ) : (
        <img
          src={url || undefined}
          alt={record.title || `${record.pose || 'Anı'} · ${dateLabel(record.date)}`}
          loading="lazy"
        />
      )}
      {record.kind === 'vlog' && <span>▶</span>}
    </button>
  );
}
