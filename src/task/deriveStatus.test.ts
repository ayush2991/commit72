import { countTaskStatuses, deriveStatus } from './deriveStatus';
import { SEVENTY_TWO_HOURS_MS, Task } from './types';

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

describe('deriveStatus', () => {
  it('returns "done" whenever completedAt is set, regardless of time', () => {
    const task = makeTask({ completedAt: 1000 });
    expect(deriveStatus(task, SEVENTY_TWO_HOURS_MS * 10)).toBe('done');
  });

  it('returns "fresh" just after commit', () => {
    const task = makeTask();
    expect(deriveStatus(task, 0)).toBe('fresh');
  });

  it('returns "fresh" below the 35% elapsed threshold', () => {
    const task = makeTask();
    expect(deriveStatus(task, SEVENTY_TWO_HOURS_MS * 0.34)).toBe('fresh');
  });

  it('returns "mid" at the 35% elapsed threshold', () => {
    const task = makeTask();
    expect(deriveStatus(task, SEVENTY_TWO_HOURS_MS * 0.35)).toBe('mid');
  });

  it('returns "urgent" at the 75% elapsed threshold', () => {
    const task = makeTask();
    expect(deriveStatus(task, SEVENTY_TWO_HOURS_MS * 0.75)).toBe('urgent');
  });

  it('returns "failed" once now reaches the deadline, with no completion', () => {
    const task = makeTask();
    expect(deriveStatus(task, SEVENTY_TWO_HOURS_MS)).toBe('failed');
  });

  it('returns "failed" well past the deadline', () => {
    const task = makeTask();
    expect(deriveStatus(task, SEVENTY_TWO_HOURS_MS * 5)).toBe('failed');
  });
});

describe('countTaskStatuses', () => {
  it('returns all zeroes for an empty list', () => {
    expect(countTaskStatuses([], 0)).toEqual({ active: 0, kept: 0, broken: 0 });
  });

  it('counts fresh, mid, and urgent tasks as active', () => {
    const fresh = makeTask({ id: 'fresh' });
    const mid = makeTask({ id: 'mid' });
    const urgent = makeTask({ id: 'urgent' });
    const now = SEVENTY_TWO_HOURS_MS * 0.8;
    expect(countTaskStatuses([fresh, mid, urgent], now)).toEqual({
      active: 3,
      kept: 0,
      broken: 0,
    });
  });

  it('counts completed tasks as kept', () => {
    const task = makeTask({ completedAt: 1000 });
    expect(countTaskStatuses([task], SEVENTY_TWO_HOURS_MS)).toEqual({
      active: 0,
      kept: 1,
      broken: 0,
    });
  });

  it('counts overdue tasks as broken', () => {
    const task = makeTask();
    expect(countTaskStatuses([task], SEVENTY_TWO_HOURS_MS)).toEqual({
      active: 0,
      kept: 0,
      broken: 1,
    });
  });

  it('ignores tasks that have already been cleaned up (not in the list)', () => {
    const stillHere = makeTask({ id: 'kept-one', completedAt: 1000 });
    // A previously-failed task that's since been swept/deleted is simply
    // absent from the list passed in — it must not still count as broken.
    expect(countTaskStatuses([stillHere], SEVENTY_TWO_HOURS_MS * 10)).toEqual({
      active: 0,
      kept: 1,
      broken: 0,
    });
  });
});
