import { Link } from 'react-router-dom';
import { useStore } from '../../app/Store';
import { weeklySnapshot } from '../../domain/report/weekly';
import { Card } from '../../ui';
import { dateLabel } from '../../domain/dates';

export function WeeklySnapshot() {
  const { date, data } = useStore();
  const summary = weeklySnapshot(date, data.dayLog, data.mealEntry, data.workoutLog);
  const fmt = (n: number | undefined) =>
    n === undefined ? '—' : n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  return (
    <Card className="stack weekly-snapshot">
      <div className="row between">
        <div>
          <p className="eyebrow">SON 7 GÜN</p>
          <h2>Haftana bir bakış</h2>
        </div>
        <Link className="button quiet" to="/progress">
          İlerlemeyi gör
        </Link>
      </div>
      <div className="stats-grid">
        <div>
          <b>{summary.sessions}</b>
          <small>tamamlanan seans</small>
        </div>
        <div>
          <b>{summary.averageKcal === undefined ? '—' : Math.round(summary.averageKcal)}</b>
          <small>kcal / kayıtlı gün</small>
        </div>
        <div>
          <b>{fmt(summary.averageProtein)}</b>
          <small>g protein / kayıtlı gün</small>
        </div>
      </div>
      <p className="small muted">
        {summary.mealDays
          ? `${summary.mealDays} beslenme günü üzerinden hesaplandı. Kayıt olmayan günler sıfır sayılmaz.`
          : 'Henüz beslenme kaydın yok. İlk öğününü eklediğinde ortalamaların burada görünür.'}
      </p>
      <div className="row between">
        <span className="small muted">Kayıtlı tartılar</span>
        <b>
          {summary.weightChange === undefined
            ? 'En az iki tartı gerekli'
            : `${summary.weightChange > 0 ? '+' : ''}${fmt(summary.weightChange)} kg`}
        </b>
      </div>
      {summary.weights.length > 0 && (
        <div className="weight-observations">
          {summary.weights.map((w) => (
            <span key={w.date}>
              <small>{dateLabel(w.date, 'd MMM')}</small>
              <b>{fmt(w.value)} kg</b>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
