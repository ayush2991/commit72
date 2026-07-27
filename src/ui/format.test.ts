import { SEVENTY_TWO_HOURS_MS, Task } from '../task/types';
import { countdownText, progressFraction } from './format';

function makeTask(overrides: Partial<Task> = {}): Task {
  const committedAt = 0;
  return {
    id: 't1',
    title: 'Test task',
    committedAt,
    deadlineAt: committedAt + SEVENTY_TWO_HOURS_MS,
    completedAt: null,
    failedAt: null,
    autoDeleteAt: null,
    recommitCount: 0,
    notificationsEnabled: true,
    ...overrides,
  };
}

describe('progressFraction', () => {
  it('tracks elapsed fraction of the commit window while live', () => {
    const task = makeTask();
    expect(progressFraction(task, 0)).toBe(0);
    expect(progressFraction(task, SEVENTY_TWO_HOURS_MS / 2)).toBeCloseTo(0.5);
  });

  it('clamps to 1 for a failed task with no autoDeleteAt yet (pre-sweep)', () => {
    const task = makeTask();
    expect(progressFraction(task, SEVENTY_TWO_HOURS_MS * 5)).toBe(1);
  });

  it('tracks elapsed fraction of the retention window once autoDeleteAt is set (done)', () => {
    const task = makeTask({
      completedAt: 1000,
      autoDeleteAt: 1000 + SEVENTY_TWO_HOURS_MS,
    });
    expect(progressFraction(task, 1000)).toBe(0);
    expect(
      progressFraction(task, 1000 + SEVENTY_TWO_HOURS_MS / 2)
    ).toBeCloseTo(0.5);
    expect(progressFraction(task, 1000 + SEVENTY_TWO_HOURS_MS)).toBe(1);
  });

  it('tracks elapsed fraction of the retention window once autoDeleteAt is set (failed)', () => {
    const task = makeTask({
      failedAt: SEVENTY_TWO_HOURS_MS,
      autoDeleteAt: SEVENTY_TWO_HOURS_MS * 2,
    });
    expect(progressFraction(task, SEVENTY_TWO_HOURS_MS)).toBe(0);
    expect(
      progressFraction(task, SEVENTY_TWO_HOURS_MS * 1.5)
    ).toBeCloseTo(0.5);
  });
});

describe('countdownText', () => {
  it('reads "X left" while the task is live', () => {
    const task = makeTask();
    expect(countdownText(task, SEVENTY_TWO_HOURS_MS - 60 * 60 * 1000)).toBe(
      '1h left'
    );
  });

  it('reads "Expired" for a failed task with no autoDeleteAt yet (pre-sweep)', () => {
    const task = makeTask();
    expect(countdownText(task, SEVENTY_TWO_HOURS_MS)).toBe('Expired');
  });

  it('reads "Removed in Xh/Xm/Xs" once autoDeleteAt is set', () => {
    const autoDeleteAt = 10 * SEVENTY_TWO_HOURS_MS;
    const task = makeTask({ completedAt: 0, autoDeleteAt });
    expect(countdownText(task, autoDeleteAt - 60 * 60 * 1000)).toBe(
      'Removed in 1h'
    );
    expect(countdownText(task, autoDeleteAt - 60 * 1000)).toBe(
      'Removed in 1m'
    );
    expect(countdownText(task, autoDeleteAt - 1000)).toBe('Removed in 1s');
  });

  it('reads "Removing…" once past autoDeleteAt', () => {
    const task = makeTask({ completedAt: 0, autoDeleteAt: 1000 });
    expect(countdownText(task, 1000)).toBe('Removing…');
    expect(countdownText(task, 5000)).toBe('Removing…');
  });
});
