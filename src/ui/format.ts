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
 * Fraction of this task's own window elapsed, clamped to [0, 1]. Uses the
 * task's stored window (deadlineAt - committedAt) rather than a fixed 72h, so
 * the bar stays correct under the dev-compressed clock. Done reads as full.
 */
export function progressFraction(task: Task, now: number): number {
  if (task.completedAt !== null) return 1;
  const window = task.deadlineAt - task.committedAt;
  if (window <= 0) return 1;
  return Math.max(0, Math.min(1, (now - task.committedAt) / window));
}

/** Right-aligned countdown, e.g. "5h left", "42m left", "9s left", "Expired". */
export function countdownText(task: Task, now: number): string {
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
