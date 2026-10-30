import { describe, it, expect } from 'vitest';
import {
  newSession,
  pauseSession,
  resumeSession,
  finishSession,
  workoutElapsedMs,
  intervalElapsedMs,
} from './session';
import { workoutEnergy } from '../energy';
import type { WorkoutLog } from '../types';

const exercises = [{ exerciseId: 'rdl', sets: 3, minReps: 8, maxReps: 12, restSec: 90 }];
const log: WorkoutLog = {
  id: 'w',
  date: '2026-10-30',
  type: 'strength',
  startedAt: 1000,
  done: false,
  sets: [],
  session: newSession(exercises),
};
describe('persistent workout clocks', () => {
  it('keeps a snapshot separate from the saved plan', () => {
    const session = newSession(exercises);
    session.exercises[0].sets = 4;
    expect(exercises[0].sets).toBe(3);
  });
  it('freezes duration and all timers while paused, then resumes at the same remaining time', () => {
    const session = pauseSession(
      {
        ...log.session!,
        restUntil: 121000,
        phase: 'warmup',
        phaseUntil: 181000,
        intervalStartedAt: 1000,
      },
      61000,
    );
    expect(session).toMatchObject({
      pausedAt: 61000,
      restRemainingMs: 60000,
      phaseRemainingMs: 120000,
      intervalElapsedMs: 60000,
    });
    expect(workoutElapsedMs({ ...log, session }, 600000)).toBe(60000);
    expect(intervalElapsedMs(session, 600000)).toBe(60000);
    const resumed = resumeSession(session, 661000);
    expect(resumed).toMatchObject({
      pausedMs: 600000,
      restUntil: 721000,
      phaseUntil: 781000,
      intervalStartedAt: 661000,
    });
    expect(workoutElapsedMs({ ...log, session: resumed }, 691000)).toBe(90000);
    expect(intervalElapsedMs(resumed, 691000)).toBe(90000);
  });
  it('does not double subtract repeated pause/resume or an elapsed deadline', () => {
    const paused = pauseSession({ ...log.session!, restUntil: 2000 }, 3000);
    expect(pauseSession(paused, 10000)).toBe(paused);
    const resumed = resumeSession(paused, 13000);
    expect(resumeSession(resumed, 23000)).toBe(resumed);
    expect(resumed.restUntil).toBe(13000);
    expect(resumed.pausedMs).toBe(10000);
  });
  it('finishes a paused workout without charging the pause, and freezes the summary and energy', () => {
    const paused = { ...log, session: pauseSession(log.session!, 601000) };
    const finished = finishSession(paused, 1201000);
    expect(finished.done).toBe(true);
    expect(workoutElapsedMs(finished, 9999999)).toBe(600000);
    expect(workoutEnergy(finished, 80).minutes).toBe(10);
    expect(workoutEnergy(paused, 80).active).toBe(0);
  });
  it('retains cancelled data without energy or an accidental completion', () => {
    const cancelled = { ...log, cancelledAt: 601000 };
    expect(workoutElapsedMs(cancelled, 9999999)).toBe(600000);
    expect(workoutEnergy(cancelled, 80).active).toBe(0);
    expect(() => finishSession(cancelled, 1000000)).toThrow('İptal');
  });
  it('preserves the elapsed behavior of old sessions and clamps backward clocks', () => {
    expect(workoutElapsedMs({ ...log, session: undefined, endedAt: 601000 })).toBe(600000);
    expect(workoutElapsedMs(log, 0)).toBe(0);
  });
});
