import { PROGRAMS, selectProgram, type ProgramId } from '../../domain/program/programs';
import type { PlanSettings } from '../../domain/types';
export function ProgramPicker({
  settings,
  onChange,
}: {
  settings: PlanSettings;
  onChange: (settings: PlanSettings) => void;
}) {
  const selected = PROGRAMS.find((p) => p.id === (settings.programId || 'personal')) || PROGRAMS[5];
  return (
    <fieldset className="stack">
      <legend>Hazır programın</legend>
      <div className="program-grid">
        {PROGRAMS.map((program) => (
          <button
            type="button"
            className="program-choice"
            key={program.id}
            aria-pressed={selected.id === program.id}
            onClick={() => onChange(selectProgram(settings, program.id, settings.daysPerWeek))}
          >
            <b>{program.name}</b>
            <small>
              {program.days.join(' / ')} gün · {program.description}
            </small>
          </button>
        ))}
      </div>
      <label className="field">
        Programın haftalık gün sayısı
        <select
          value={settings.daysPerWeek}
          onChange={(e) =>
            onChange(selectProgram(settings, selected.id as ProgramId, +e.target.value))
          }
        >
          {selected.days.map((n) => (
            <option key={n} value={n}>
              {n} gün
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
