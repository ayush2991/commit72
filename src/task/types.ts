export const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export const DEFAULT_TASK_CAP = 6;

// Options offered on the commit sheet for how long the clock runs.
export type TaskDurationHours = 24 | 48 | 72;
export const TASK_DURATION_OPTIONS_HOURS: TaskDurationHours[] = [24, 48, 72];
export const DEFAULT_TASK_DURATION_HOURS: TaskDurationHours = 48;

// PRD §5.1 urgency bands: fresh <35% elapsed, mid 35-75%, urgent >=75%.
export const URGENT_THRESHOLD = 0.75;
export const MID_THRESHOLD = 0.35;

export interface Task {
  id: string;
  title: string;
  committedAt: number; // epoch ms, set at commit/re-commit time
  deadlineAt: number; // epoch ms, committedAt + 72h
  completedAt: number | null;
  failedAt: number | null; // set by sweep() the first time now >= deadlineAt
  autoDeleteAt: number | null; // when done/failed, completedAt/failedAt + 72h retention window
  recommitCount: number;
  notificationsEnabled: boolean;
}

// "pending-deletion" is intentionally not a surfaced status (TECH_DESIGN §3) —
// sweep() deletes those tasks outright rather than exposing a transient state.
export type TaskStatus = 'done' | 'fresh' | 'mid' | 'urgent' | 'failed';

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task not found: ${taskId}`);
    this.name = 'TaskNotFoundError';
  }
}

export class TaskCapReachedError extends Error {
  constructor(cap: number) {
    super(`Active task cap reached (${cap})`);
    this.name = 'TaskCapReachedError';
  }
}

export class InvalidTaskTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTaskTransitionError';
  }
}
