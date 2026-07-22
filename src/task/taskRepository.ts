import { Task } from './types';

/**
 * TaskService depends on this abstraction, not on a storage engine directly,
 * so the SQLite-backed implementation (TECH_DESIGN.md §1/§3) can be swapped
 * in later without touching lifecycle logic.
 */
export interface TaskRepository {
  getAll(): Task[];
  getById(id: string): Task | undefined;
  insert(task: Task): void;
  update(task: Task): void;
  delete(id: string): void;
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  getAll(): Task[] {
    return Array.from(this.tasks.values()).map((t) => ({ ...t }));
  }

  getById(id: string): Task | undefined {
    const task = this.tasks.get(id);
    return task ? { ...task } : undefined;
  }

  insert(task: Task): void {
    this.tasks.set(task.id, { ...task });
  }

  update(task: Task): void {
    this.tasks.set(task.id, { ...task });
  }

  delete(id: string): void {
    this.tasks.delete(id);
  }
}
