import { InMemoryTaskRepository } from './taskRepository';
import { TaskService } from './taskService';
import {
  InvalidTaskTransitionError,
  SEVENTY_TWO_HOURS_MS,
  TaskCapReachedError,
  TaskNotFoundError,
} from './types';

function makeService(overrides: { now?: number; taskCap?: number } = {}) {
  let currentTime = overrides.now ?? 0;
  const repository = new InMemoryTaskRepository();
  let idCounter = 0;
  const service = new TaskService({
    repository,
    now: () => currentTime,
    generateId: () => `id-${idCounter++}`,
    taskCap: overrides.taskCap,
  });
  return {
    service,
    repository,
    setNow: (t: number) => {
      currentTime = t;
    },
  };
}

describe('TaskService.commit', () => {
  it('creates a task with a 72h deadline from the commit time', () => {
    const { service } = makeService({ now: 1000 });
    const task = service.commit('Ship the thing');
    expect(task.committedAt).toBe(1000);
    expect(task.deadlineAt).toBe(1000 + SEVENTY_TWO_HOURS_MS);
    expect(task.completedAt).toBeNull();
  });

  it('honors a custom window (used by the dev-compressed clock)', () => {
    const repository = new InMemoryTaskRepository();
    const service = new TaskService({
      repository,
      now: () => 0,
      windowMs: 90_000,
    });
    const task = service.commit('Short-fuse task');
    expect(task.deadlineAt).toBe(90_000);
  });

  it('trims the title and rejects empty/whitespace-only titles', () => {
    const { service } = makeService();
    expect(service.commit('  Buy milk  ').title).toBe('Buy milk');
    expect(() => service.commit('   ')).toThrow(InvalidTaskTransitionError);
  });

  it('enforces the active task cap', () => {
    const { service } = makeService({ taskCap: 2 });
    service.commit('One');
    service.commit('Two');
    expect(() => service.commit('Three')).toThrow(TaskCapReachedError);
  });

  it('does not count done or failed tasks against the cap', () => {
    const { service } = makeService({ taskCap: 1, now: 0 });
    const t1 = service.commit('One');
    service.complete(t1.id);
    // cap is 1 active task; the completed task should not block a new commit
    expect(() => service.commit('Two')).not.toThrow();
  });
});

describe('TaskService.complete', () => {
  it('marks a task done and is idempotent', () => {
    const { service, setNow } = makeService({ now: 0 });
    const task = service.commit('Finish report');
    setNow(500);
    const completed = service.complete(task.id);
    expect(completed.completedAt).toBe(500);

    setNow(999);
    const completedAgain = service.complete(task.id);
    expect(completedAgain.completedAt).toBe(500); // unchanged, idempotent
  });

  it('throws for an unknown task id', () => {
    const { service } = makeService();
    expect(() => service.complete('nope')).toThrow(TaskNotFoundError);
  });
});

describe('TaskService.sweep', () => {
  it('marks an expired task as failed and sets the auto-delete grace period', () => {
    const { service, repository, setNow } = makeService({ now: 0 });
    const task = service.commit('Overdue thing');

    setNow(SEVENTY_TWO_HOURS_MS);
    const result = service.sweep();

    expect(result.failed.map((t) => t.id)).toEqual([task.id]);
    const stored = repository.getAll().find((t) => t.id === task.id)!;
    expect(stored.failedAt).toBe(SEVENTY_TWO_HOURS_MS);
    expect(stored.autoDeleteAt).toBe(SEVENTY_TWO_HOURS_MS * 2);
  });

  it('does not re-flag an already-failed task on repeated sweeps', () => {
    const { service, setNow } = makeService({ now: 0 });
    service.commit('Overdue thing');
    setNow(SEVENTY_TWO_HOURS_MS);
    service.sweep();

    setNow(SEVENTY_TWO_HOURS_MS + 1000);
    const result = service.sweep();
    expect(result.failed).toHaveLength(0);
  });

  it('auto-deletes a failed task once the grace period elapses', () => {
    const { service, repository, setNow } = makeService({ now: 0 });
    const task = service.commit('Overdue thing');
    setNow(SEVENTY_TWO_HOURS_MS);
    service.sweep();

    setNow(SEVENTY_TWO_HOURS_MS * 2);
    const result = service.sweep();

    expect(result.deleted.map((t) => t.id)).toEqual([task.id]);
    expect(repository.getAll()).toHaveLength(0);
  });

  it('anchors failedAt to the deadline, not to a late sweep time', () => {
    const { service, repository, setNow } = makeService({ now: 0 });
    const task = service.commit('Missed while app was closed');

    // App reopened well after the deadline but still within the grace window.
    setNow(SEVENTY_TWO_HOURS_MS + SEVENTY_TWO_HOURS_MS / 2);
    const result = service.sweep();

    expect(result.failed.map((t) => t.id)).toEqual([task.id]);
    const stored = repository.getAll().find((t) => t.id === task.id)!;
    // Failure is dated at the deadline itself, so the grace window is not
    // silently restarted by opening the app late.
    expect(stored.failedAt).toBe(SEVENTY_TWO_HOURS_MS);
    expect(stored.autoDeleteAt).toBe(SEVENTY_TWO_HOURS_MS * 2);
  });

  it('fails and deletes in one sweep when reopened past the grace window', () => {
    const { service, repository, setNow } = makeService({ now: 0 });
    const task = service.commit('Missed for over a week');

    // App closed long enough to blow past both the deadline and the grace
    // period — a single sweep must fully retire the task.
    setNow(SEVENTY_TWO_HOURS_MS * 5);
    const result = service.sweep();

    // Reported only as deleted: it never survived long enough to surface as
    // a live failed task.
    expect(result.deleted.map((t) => t.id)).toEqual([task.id]);
    expect(result.failed).toHaveLength(0);
    expect(repository.getAll()).toHaveLength(0);
  });

  it('never touches a completed task, even long past its deadline', () => {
    const { service, repository, setNow } = makeService({ now: 0 });
    const task = service.commit('Done early');
    service.complete(task.id);

    setNow(SEVENTY_TWO_HOURS_MS * 10);
    const result = service.sweep();

    expect(result.failed).toHaveLength(0);
    expect(result.deleted).toHaveLength(0);
    expect(repository.getAll()[0].completedAt).not.toBeNull();
  });
});

describe('TaskService.recommit', () => {
  it('restarts the 72h clock and increments recommitCount', () => {
    const { service, setNow } = makeService({ now: 0 });
    const task = service.commit('Slipping task');
    setNow(SEVENTY_TWO_HOURS_MS);
    service.sweep();

    setNow(SEVENTY_TWO_HOURS_MS + 5000);
    const recommitted = service.recommit(task.id);

    expect(recommitted.committedAt).toBe(SEVENTY_TWO_HOURS_MS + 5000);
    expect(recommitted.deadlineAt).toBe(
      SEVENTY_TWO_HOURS_MS + 5000 + SEVENTY_TWO_HOURS_MS
    );
    expect(recommitted.failedAt).toBeNull();
    expect(recommitted.autoDeleteAt).toBeNull();
    expect(recommitted.recommitCount).toBe(1);
  });

  it('refuses to re-commit a task that is not currently failed', () => {
    const { service } = makeService({ now: 0 });
    const task = service.commit('Still active');
    expect(() => service.recommit(task.id)).toThrow(InvalidTaskTransitionError);
  });

  it('enforces the active task cap on re-commit', () => {
    const { service, setNow } = makeService({ now: 0, taskCap: 1 });
    const failing = service.commit('Will fail');
    setNow(SEVENTY_TWO_HOURS_MS);
    service.sweep();

    // fills the single cap slot with a new active task
    service.commit('Takes the only slot');

    expect(() => service.recommit(failing.id)).toThrow(TaskCapReachedError);
  });
});

describe('TaskService.deleteManually', () => {
  it('deletes an active task', () => {
    const { service, repository } = makeService();
    const task = service.commit('Delete me');
    service.deleteManually(task.id);
    expect(repository.getAll()).toHaveLength(0);
  });

  it('deletes a failed task (PRD: manual delete works on any task, any time)', () => {
    const { service, repository, setNow } = makeService({ now: 0 });
    const task = service.commit('Will fail then be deleted');
    setNow(SEVENTY_TWO_HOURS_MS);
    service.sweep();

    service.deleteManually(task.id);
    expect(repository.getAll()).toHaveLength(0);
  });

  it('throws for an unknown task id', () => {
    const { service } = makeService();
    expect(() => service.deleteManually('nope')).toThrow(TaskNotFoundError);
  });
});
