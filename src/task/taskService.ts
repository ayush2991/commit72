import { deriveStatus, isActiveStatus } from './deriveStatus';
import { generateTaskId } from './id';
import { TaskRepository } from './taskRepository';
import {
  DEFAULT_TASK_CAP,
  InvalidTaskTransitionError,
  SEVENTY_TWO_HOURS_MS,
  Task,
  TaskCapReachedError,
  TaskNotFoundError,
} from './types';

export interface TaskServiceOptions {
  repository: TaskRepository;
  now?: () => number;
  generateId?: () => string;
  taskCap?: number;
  /**
   * Length of the commitment window (and the post-failure grace period).
   * Defaults to the real 72h; the app compresses it in dev so the full
   * lifecycle is watchable in seconds. deriveStatus is window-agnostic — it
   * reads each task's own committedAt/deadlineAt — so this is the only place
   * the duration lives.
   */
  windowMs?: number;
}

export interface SweepResult {
  failed: Task[];
  deleted: Task[];
}

/**
 * Pure lifecycle logic (TECH_DESIGN.md §4) — no React/UI dependencies, so it
 * can be unit tested directly against an in-memory repository.
 */
export class TaskService {
  private repository: TaskRepository;
  private now: () => number;
  private generateId: () => string;
  private taskCap: number;
  private windowMs: number;

  constructor(options: TaskServiceOptions) {
    this.repository = options.repository;
    this.now = options.now ?? Date.now;
    this.generateId = options.generateId ?? generateTaskId;
    this.taskCap = options.taskCap ?? DEFAULT_TASK_CAP;
    this.windowMs = options.windowMs ?? SEVENTY_TWO_HOURS_MS;
  }

  commit(title: string): Task {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new InvalidTaskTransitionError('Task title cannot be empty');
    }

    const now = this.now();
    if (this.activeTaskCount(now) >= this.taskCap) {
      throw new TaskCapReachedError(this.taskCap);
    }

    const task: Task = {
      id: this.generateId(),
      title: trimmed,
      committedAt: now,
      deadlineAt: now + this.windowMs,
      completedAt: null,
      failedAt: null,
      autoDeleteAt: null,
      recommitCount: 0,
      notificationsEnabled: true,
    };
    this.repository.insert(task);
    return task;
  }

  complete(taskId: string): Task {
    const task = this.getOrThrow(taskId);
    if (task.completedAt !== null) {
      return task; // idempotent
    }
    const now = this.now();
    const status = deriveStatus(task, now);
    if (status === 'failed') {
      throw new InvalidTaskTransitionError(
        `Cannot complete a task with status "${status}"`
      );
    }
    const updated: Task = { ...task, completedAt: now };
    this.repository.update(updated);
    return updated;
  }

  /** Only valid on a task whose derived status is currently "failed". */
  recommit(taskId: string): Task {
    const task = this.getOrThrow(taskId);
    const now = this.now();
    const status = deriveStatus(task, now);
    if (status !== 'failed') {
      throw new InvalidTaskTransitionError(
        `Cannot re-commit a task with status "${status}"`
      );
    }
    if (this.activeTaskCount(now, task.id) >= this.taskCap) {
      throw new TaskCapReachedError(this.taskCap);
    }

    const updated: Task = {
      ...task,
      committedAt: now,
      deadlineAt: now + this.windowMs,
      failedAt: null,
      autoDeleteAt: null,
      recommitCount: task.recommitCount + 1,
    };
    this.repository.update(updated);
    return updated;
  }

  /** Valid on any task regardless of status (PRD §7 — manual delete anytime). */
  deleteManually(taskId: string): void {
    this.getOrThrow(taskId);
    this.repository.delete(taskId);
  }

  /**
   * Run on app foreground/resume (TECH_DESIGN.md §4/§9 — foreground-only,
   * no background-fetch task in v1). Self-healing: produces correct state
   * even after the app was closed for days, since it re-derives everything
   * from stored timestamps rather than relying on timers having fired.
   */
  sweep(now: number = this.now()): SweepResult {
    const failed: Task[] = [];
    const deleted: Task[] = [];

    for (const stored of this.repository.getAll()) {
      if (stored.completedAt !== null) continue;

      // Anchor failure to the deadline (a past fact), never to sweep time (an
      // observation). Otherwise opening the app late would restart the grace
      // window — see TECH_DESIGN.md §2, self-correcting read path.
      const justFailed = stored.failedAt === null && now >= stored.deadlineAt;
      const task: Task = justFailed
        ? {
            ...stored,
            failedAt: stored.deadlineAt,
            autoDeleteAt: stored.deadlineAt + this.windowMs,
          }
        : stored;

      // A task overdue by more than the grace period fails and is deleted in
      // one sweep (e.g. app closed for days), rather than surviving one grace
      // window per foreground. When that happens it is reported only as
      // deleted — it never persisted long enough to surface as failed.
      const pastGrace =
        task.failedAt !== null &&
        task.autoDeleteAt !== null &&
        now >= task.autoDeleteAt;

      if (pastGrace) {
        this.repository.delete(task.id);
        deleted.push(task);
      } else if (justFailed) {
        this.repository.update(task);
        failed.push(task);
      }
    }

    return { failed, deleted };
  }

  private activeTaskCount(now: number, excludeId?: string): number {
    return this.repository
      .getAll()
      .filter((t) => t.id !== excludeId && isActiveStatus(deriveStatus(t, now)))
      .length;
  }

  private getOrThrow(taskId: string): Task {
    const task = this.repository.getAll().find((t) => t.id === taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }
    return task;
  }
}
