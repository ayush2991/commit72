// Manual mock for expo-sqlite, Jest's native-module boundary. Node modules
// placed here under __mocks__/ are picked up automatically for every test
// file (see https://jestjs.io/docs/manual-mocks#mocking-node-modules) — no
// per-file `jest.mock('expo-sqlite')` needed.
//
// Only implements what src/store/settingsRepository.ts's
// SQLiteSettingsRepository actually issues (a single key/value settings
// table with a get-by-key select and an upsert). It is not a general SQL
// engine — src/task/taskRepository.ts's SQLiteTaskRepository stays
// deliberately untested under Jest per CLAUDE.md, so its richer queries
// don't need support here.

function createDatabase() {
  const settings = new Map();
  return {
    execSync: () => {},
    getFirstSync: (_sql, params) => {
      const key = params[0];
      return settings.has(key) ? { value: settings.get(key) } : null;
    },
    runSync: (_sql, params) => {
      const [key, value] = params;
      settings.set(key, value);
    },
  };
}

const databases = new Map();

function openDatabaseSync(name) {
  if (!databases.has(name)) {
    databases.set(name, createDatabase());
  }
  return databases.get(name);
}

module.exports = { openDatabaseSync };
