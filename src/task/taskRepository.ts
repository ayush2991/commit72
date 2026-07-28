import * as SQLite from 'expo-sqlite';
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

interface TaskRow {
  id: string;
  title: string;
  committedAt: number;
  deadlineAt: number;
  completedAt: number | null;
  failedAt: number | null;
  autoDeleteAt: number | null;
  recommitCount: number;
  notificationsEnabled: number;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    committedAt: row.committedAt,
    deadlineAt: row.deadlineAt,
    completedAt: row.completedAt,
    failedAt: row.failedAt,
    autoDeleteAt: row.autoDeleteAt,
    recommitCount: row.recommitCount,
    notificationsEnabled: row.notificationsEnabled === 1,
  };
}

/**
 * Durable, on-device storage (TECH_DESIGN.md §1/§3) backed by expo-sqlite's
 * synchronous API — survives the app process being killed, and only clears
 * when the app itself is uninstalled, unlike InMemoryTaskRepository which
 * loses everything on process death. Uses openDatabaseSync/*Sync methods
 * (not the async API) so this stays a drop-in TaskRepository: TaskService
 * calls it synchronously and never has to await hydration before reading.
 */
export class SQLiteTaskRepository implements TaskRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(databaseName = 'pactpal.db') {
    this.db = SQLite.openDatabaseSync(databaseName);
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        committedAt INTEGER NOT NULL,
        deadlineAt INTEGER NOT NULL,
        completedAt INTEGER,
        failedAt INTEGER,
        autoDeleteAt INTEGER,
        recommitCount INTEGER NOT NULL DEFAULT 0,
        notificationsEnabled INTEGER NOT NULL DEFAULT 1
      );
    `);
  }

  getAll(): Task[] {
    return this.db
      .getAllSync<TaskRow>('SELECT * FROM tasks ORDER BY committedAt ASC')
      .map(rowToTask);
  }

  getById(id: string): Task | undefined {
    const row = this.db.getFirstSync<TaskRow>(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    return row ? rowToTask(row) : undefined;
  }

  insert(task: Task): void {
    this.db.runSync(
      `INSERT INTO tasks
        (id, title, committedAt, deadlineAt, completedAt, failedAt, autoDeleteAt, recommitCount, notificationsEnabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.committedAt,
        task.deadlineAt,
        task.completedAt,
        task.failedAt,
        task.autoDeleteAt,
        task.recommitCount,
        task.notificationsEnabled ? 1 : 0,
      ]
    );
  }

  update(task: Task): void {
    this.db.runSync(
      `UPDATE tasks SET
        title = ?, committedAt = ?, deadlineAt = ?, completedAt = ?,
        failedAt = ?, autoDeleteAt = ?, recommitCount = ?, notificationsEnabled = ?
       WHERE id = ?`,
      [
        task.title,
        task.committedAt,
        task.deadlineAt,
        task.completedAt,
        task.failedAt,
        task.autoDeleteAt,
        task.recommitCount,
        task.notificationsEnabled ? 1 : 0,
        task.id,
      ]
    );
  }

  delete(id: string): void {
    this.db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
  }
}
