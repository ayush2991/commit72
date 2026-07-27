import { create } from 'zustand';
import { InMemoryTaskRepository } from '../task/taskRepository';
import { TaskService } from '../task/taskService';
import { Task, TaskDurationHours } from '../task/types';

/**
 * The store owns a single TaskService over the in-memory repository. The
 * service is the source of truth; `tasks`/`now` in the store are a cache of it
 * that React subscribes to. Every mutating action re-pulls from the repository
 * so the list can never drift from the service's state.
 *
 * Swapping InMemoryTaskRepository for the future expo-sqlite repository (see
 * TECH_DESIGN.md §1/§3) is a one-line change here — nothing else in the UI
 * depends on the storage engine.
 */
const repository = new InMemoryTaskRepository();

// Dev-only: compress the 72h window so the whole lifecycle
// (fresh → mid → urgent → failed → auto-deleted) plays out in a couple of
// minutes and is watchable on screen. `__DEV__` is false in release builds, so
// production always uses TaskService's real 72h default. With a 90s window:
// mid at ~32s, urgent at ~68s, failed at 90s, auto-deleted at 180s.
const DEV_WINDOW_MS = 90 * 1000;

const service = new TaskService({
  repository,
  ...(__DEV__ ? { windowMs: DEV_WINDOW_MS } : {}),
});

if (__DEV__) {
  console.log(
    `[pactpal] dev clock active: ${DEV_WINDOW_MS / 1000}s window (not 72h)`
  );
}

export interface TaskStore {
  tasks: Task[];
  now: number;
  commit: (title: string, durationHours?: TaskDurationHours) => void;
  complete: (id: string) => void;
  recommit: (id: string) => void;
  remove: (id: string) => void;
  /** Foreground/tick: fail expired tasks, delete past-grace ones, refresh. */
  sweep: () => void;
}

export const useTaskStore = create<TaskStore>((set) => {
  const sync = () => set({ tasks: repository.getAll(), now: Date.now() });

  return {
    tasks: repository.getAll(),
    now: Date.now(),
    commit: (title, durationHours) => {
      service.commit(title, durationHours);
      sync();
    },
    complete: (id) => {
      service.complete(id);
      sync();
    },
    recommit: (id) => {
      service.recommit(id);
      sync();
    },
    remove: (id) => {
      service.deleteManually(id);
      sync();
    },
    sweep: () => {
      service.sweep();
      sync();
    },
  };
});
