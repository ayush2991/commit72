import * as SQLite from 'expo-sqlite';

/**
 * Tiny key/value persistence for single-value app preferences (active pet,
 * theme, etc.) that don't warrant their own table shape. Mirrors the
 * TaskRepository split (see task/taskRepository.ts): an interface plus an
 * in-memory implementation for tests and a SQLite-backed one for the app, so
 * a preference survives the app process being killed instead of resetting to
 * its default on next launch.
 */
export interface SettingsRepository {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

export class InMemorySettingsRepository implements SettingsRepository {
  private values = new Map<string, string>();

  get(key: string): string | undefined {
    return this.values.get(key);
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }
}

export class SQLiteSettingsRepository implements SettingsRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(databaseName = 'pactpal.db') {
    this.db = SQLite.openDatabaseSync(databaseName);
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  get(key: string): string | undefined {
    const row = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value;
  }

  set(key: string, value: string): void {
    this.db.runSync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }
}
