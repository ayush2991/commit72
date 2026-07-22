# Known Bugs

Issues found during code review that are documented but not yet fixed. Fixed
items are removed from this list. Last reviewed: 2026-07-12.

## 1. `InMemoryTaskRepository.getAll()` leaks internal object references

**Where:** `InMemoryTaskRepository.getAll`, `src/task/taskRepository.ts`.

**Problem:** `insert`/`update` defensively store copies (`{ ...task }`), but
`getAll` returns those stored objects directly. A caller (e.g. future UI code)
that mutates a returned `Task` corrupts repository state. `TaskService` itself
is disciplined (always spreads into new objects), so nothing triggers it today,
but the defensive-copy-on-write is only half applied.

**Fix direction:** Return copies (`.map((t) => ({ ...t }))`) or document that
returned tasks are read-only.

**Severity:** Encapsulation leak / latent. No current trigger.
