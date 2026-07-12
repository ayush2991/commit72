import { MID_THRESHOLD, Task, TaskStatus, URGENT_THRESHOLD } from './types';

/**
 * Status is always derived from stored timestamps, never trusted from a
 * persisted field — see TECH_DESIGN.md §2. Safe to call after the app has
 * been closed for any length of time.
 */
export function deriveStatus(task: Task, now: number): TaskStatus {
  if (task.completedAt !== null) {
    return 'done';
  }

  if (now >= task.deadlineAt) {
    return 'failed';
  }

  const totalWindow = task.deadlineAt - task.committedAt;
  const elapsed = now - task.committedAt;
  const elapsedFraction = totalWindow > 0 ? elapsed / totalWindow : 1;

  if (elapsedFraction >= URGENT_THRESHOLD) {
    return 'urgent';
  }
  if (elapsedFraction >= MID_THRESHOLD) {
    return 'mid';
  }
  return 'fresh';
}

export function isActiveStatus(status: TaskStatus): boolean {
  return status === 'fresh' || status === 'mid' || status === 'urgent';
}
