import type { TemplateExercise, WorkoutLog, WorkoutSession } from '../types';

export function newSession(exercises: TemplateExercise[]): WorkoutSession {
  return {
    exercises: exercises.map((e) => ({ ...e })),
    current: 0,
    pausedMs: 0,
    intervalElapsedMs: 0,
  };
}
export function workoutElapsedMs(log: WorkoutLog, now = Date.now()) {
  const end = log.endedAt ?? log.cancelledAt ?? log.session?.pausedAt ?? now;
  return Math.max(0, end - log.startedAt - (log.session?.pausedMs ?? 0));
}
export function intervalElapsedMs(session: WorkoutSession, now: number) {
  return (
    session.intervalElapsedMs +
    (session.intervalStartedAt === undefined ? 0 : Math.max(0, now - session.intervalStartedAt))
  );
}
export function pauseSession(session: WorkoutSession, now: number): WorkoutSession {
  if (session.pausedAt !== undefined) return session;
  return {
    ...session,
    pausedAt: now,
    restRemainingMs:
      session.restUntil === undefined ? undefined : Math.max(0, session.restUntil - now),
    restUntil: undefined,
    phaseRemainingMs:
      session.phaseUntil === undefined ? undefined : Math.max(0, session.phaseUntil - now),
    phaseUntil: undefined,
    intervalWasRunning: session.intervalStartedAt !== undefined,
    intervalElapsedMs: intervalElapsedMs(session, now),
    intervalStartedAt: undefined,
  };
}
export function resumeSession(session: WorkoutSession, now: number): WorkoutSession {
  if (session.pausedAt === undefined) return session;
  return {
    ...session,
    pausedMs: session.pausedMs + Math.max(0, now - session.pausedAt),
    pausedAt: undefined,
    restUntil: session.restRemainingMs === undefined ? undefined : now + session.restRemainingMs,
    restRemainingMs: undefined,
    phaseUntil: session.phaseRemainingMs === undefined ? undefined : now + session.phaseRemainingMs,
    phaseRemainingMs: undefined,
    intervalStartedAt: session.intervalWasRunning ? now : undefined,
    intervalWasRunning: undefined,
  };
}
export function finishSession(log: WorkoutLog, now: number): WorkoutLog {
  if (log.cancelledAt !== undefined) throw new Error('İptal edilen seans tamamlanamaz.');
  const session = log.session ? resumeSession(log.session, now) : undefined;
  return {
    ...log,
    done: true,
    endedAt: now,
    session: session
      ? {
          ...session,
          restUntil: undefined,
          phase: undefined,
          phaseUntil: undefined,
          intervalElapsedMs: intervalElapsedMs(session, now),
          intervalStartedAt: undefined,
        }
      : undefined,
  };
}
