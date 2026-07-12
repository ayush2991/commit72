# Known Bugs

Issues found during code review that are documented but not yet fixed. Fixed
items are removed from this list. Last reviewed: 2026-07-12.

## 1. `TaskRepository` has no `getById` — forces full-table scans

**Where:** `src/task/taskRepository.ts` (interface), consumed by
`TaskService.getOrThrow` and `TaskService.activeTaskCount` in
`src/task/taskService.ts`.

**Problem:** The repository interface exposes only `getAll()`. Single-task
lookups (`complete`, `recommit`, `deleteManually`) and the active-count check
therefore load every row and filter in JS:

```ts
const task = this.repository.getAll().find((t) => t.id === taskId);
```

At the task cap of 5 this is harmless in memory, but this interface is the
contract the SQLite adapter must implement, so it bakes in "load the whole
table to look up one row" and prevents pushing `WHERE id = ?` / a count query
down into SQL.

**Fix direction:** Add `getById(id): Task | undefined` (and optionally a count
query) to the interface **before** the SQLite adapter freezes the contract.

**Severity:** Design smell / future performance. Not a runtime bug today.

## 2. `complete()` has no lifecycle guard and leaves stale failure timestamps

**Where:** `TaskService.complete`, `src/task/taskService.ts`.

**Problem:** `complete` sets `completedAt` if unset but never checks status and
never clears `failedAt` / `autoDeleteAt`. Completing an already-failed task
yields a row with `completedAt` **and** `failedAt` both set (plus a live
`autoDeleteAt`). `deriveStatus` checks `completedAt` first so it still reads as
`done`, but the persisted record is self-contradictory. This is inconsistent
with `recommit`, which strictly rejects any status that isn't `failed`.

**Fix direction:** Decide the intent explicitly. Either (a) allow completing a
failed task and clear `failedAt`/`autoDeleteAt` in the update to keep the row
coherent, or (b) guard it like `recommit` does.

**Severity:** Data-hygiene / latent. Renders correctly today.

## 3. `InMemoryTaskRepository.getAll()` leaks internal object references

**Where:** `InMemoryTaskRepository.getAll`, `src/task/taskRepository.ts`.

**Problem:** `insert`/`update` defensively store copies (`{ ...task }`), but
`getAll` returns those stored objects directly. A caller (e.g. future UI code)
that mutates a returned `Task` corrupts repository state. `TaskService` itself
is disciplined (always spreads into new objects), so nothing triggers it today,
but the defensive-copy-on-write is only half applied.

**Fix direction:** Return copies (`.map((t) => ({ ...t }))`) or document that
returned tasks are read-only.

**Severity:** Encapsulation leak / latent. No current trigger.
