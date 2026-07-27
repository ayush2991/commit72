import { deriveStatus } from '../task/deriveStatus';
import { Task, TaskStatus } from '../task/types';

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

// Mockup badge wording: note "mid" surfaces as "IN PROGRESS", not "MID".
const LABELS: Record<TaskStatus, string> = {
  done: 'DONE',
  fresh: 'FRESH',
  mid: 'IN PROGRESS',
  urgent: 'URGENT',
  failed: 'FAILED',
};

export function statusLabel(status: TaskStatus): string {
  return LABELS[status];
}

/**
 * Fraction of this task's current window elapsed, clamped to [0, 1]. While
 * live, that's the commitment window (deadlineAt - committedAt). Once a task
 * is done or failed and has an autoDeleteAt (the retention window before
 * auto-cleanup), the bar repurposes itself to track that instead — reusing
 * the same track/fill UI to show time-until-removal rather than adding a new
 * element. Window is each task's own stored value rather than a fixed 72h, so
 * this stays correct under the dev-compressed clock either way.
 */
export function progressFraction(task: Task, now: number): number {
  if (task.autoDeleteAt !== null) {
    const anchor = task.completedAt ?? task.failedAt ?? task.autoDeleteAt;
    const window = task.autoDeleteAt - anchor;
    return window <= 0 ? 1 : Math.max(0, Math.min(1, (now - anchor) / window));
  }
  const window = task.deadlineAt - task.committedAt;
  if (window <= 0) return 1;
  return Math.max(0, Math.min(1, (now - task.committedAt) / window));
}

/**
 * Right-aligned countdown. While live: "5h left" / "42m left" / "9s left".
 * Once a task has an autoDeleteAt (done or failed, retention in progress):
 * "Removed in 6h" / "Removed in 42m" / "Removed in 9s" / "Removing…".
 */
export function countdownText(task: Task, now: number): string {
  if (task.autoDeleteAt !== null) {
    const remaining = task.autoDeleteAt - now;
    if (remaining <= 0) return 'Removing…';
    if (remaining >= HOUR_MS) return `Removed in ${Math.floor(remaining / HOUR_MS)}h`;
    if (remaining >= MINUTE_MS) return `Removed in ${Math.floor(remaining / MINUTE_MS)}m`;
    return `Removed in ${Math.max(1, Math.ceil(remaining / SECOND_MS))}s`;
  }
  // Defensive fallbacks below — completedAt always carries an autoDeleteAt
  // (set together in TaskService.complete()), and a just-failed task only
  // lacks one for the brief window before the next sweep() tick fills it in.
  if (task.completedAt !== null) return 'Completed';
  const remaining = task.deadlineAt - now;
  if (remaining <= 0) return 'Expired';
  if (remaining >= HOUR_MS) return `${Math.floor(remaining / HOUR_MS)}h left`;
  if (remaining >= MINUTE_MS) return `${Math.floor(remaining / MINUTE_MS)}m left`;
  return `${Math.max(1, Math.ceil(remaining / SECOND_MS))}s left`;
}

/** Left-aligned "committed" line, e.g. "Committed 12h ago" / "38s ago". */
export function committedAgoText(task: Task, now: number): string {
  const elapsed = Math.max(0, now - task.committedAt);
  if (elapsed >= HOUR_MS) return `Committed ${Math.floor(elapsed / HOUR_MS)}h ago`;
  if (elapsed >= MINUTE_MS) return `Committed ${Math.floor(elapsed / MINUTE_MS)}m ago`;
  return `Committed ${Math.floor(elapsed / SECOND_MS)}s ago`;
}

/**
 * Timeline ordering: live tasks first (soonest deadline on top, so the most
 * urgent commitment leads), then failed, then done. Status is re-derived from
 * `now` so the sort stays correct as clocks tick.
 */
export function sortForTimeline(tasks: Task[], now: number): Task[] {
  const rank: Record<TaskStatus, number> = {
    urgent: 0,
    mid: 0,
    fresh: 0,
    failed: 1,
    done: 2,
  };
  return [...tasks].sort((a, b) => {
    const ra = rank[deriveStatus(a, now)];
    const rb = rank[deriveStatus(b, now)];
    if (ra !== rb) return ra - rb;
    return a.deadlineAt - b.deadlineAt;
  });
}
