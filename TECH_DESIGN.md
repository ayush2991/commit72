# Commit72 — Technical Design Doc (v1)

Based on `PRD.md`. Scope: local-first mobile app, iOS + Android, solo/hobby project.

## 1. Stack recommendation

**React Native + Expo (TypeScript).**

Rationale, given "solo hobby, flexible" + local-first v1 + iOS & Android from one codebase:
- One codebase covers both platforms without the ~2x maintenance cost of native Swift/Kotlin.
- Expo specifically (over bare React Native) because this app needs exactly what Expo's managed workflow covers well out of the box: local notifications, local SQLite storage, and simple builds/OTA updates — without needing custom native modules. That avoids a lot of native-tooling overhead for a solo project.
- Largest ecosystem and documentation base of the cross-platform options, which matters for a project likely to lean on AI-assisted development and community references while building solo.
- Flutter was the other reasonable candidate (arguably nicer for the countdown/progress-bar-heavy urgency visuals), but Dart has a smaller footprint in docs/AI training data and a smaller hobbyist community than JS/TS — RN is the safer default here. Revisit if the urgency-animation work in the Timeline screen turns out to need more custom rendering than RN comfortably provides.

Core libraries:
- **Navigation**: `react-navigation` (native-stack) — Timeline (home) → Commit (modal) → Failed detail (push).
- **State**: `zustand` — the app's state is small (a handful of tasks, no complex derived global state), so Redux-level ceremony isn't warranted.
- **Persistence**: `expo-sqlite` — durable, queryable by status/deadline, and avoids the failure modes of plain AsyncStorage/JSON blobs (partial writes, no querying) as the failed-task list grows.
- **Notifications**: `expo-notifications` (local, on-device scheduled notifications — no push server needed for v1 since there's no backend).
- **Dates/scheduling math**: native `Date` + a small utility module; no need for a heavy date library at this scale.

## 2. Architecture overview

Fully local-first, no backend, no accounts, single device:

```
┌─────────────────────────────┐
│   UI (React Native screens) │  Timeline / Commit / Failed Detail
├─────────────────────────────┤
│   Zustand store              │  in-memory task state, derived urgency
├─────────────────────────────┤
│   Task Service (pure funcs)  │  status derivation, cap enforcement,
│                               │  lifecycle transitions
├─────────────────────────────┤
│   SQLite (expo-sqlite)       │  durable task records
├─────────────────────────────┤
│   Notification Service       │  schedules/cancels local notifications
│   (expo-notifications)       │  tied to task lifecycle events
└─────────────────────────────┘
```

Key architectural decision: **task status is always derived from timestamps at read-time, never trusted from a stored "status" field alone.** Background timers/OS schedulers are not reliable for state transitions (iOS/Android can suspend background execution), so:
- Every task row stores only immutable facts: `committedAt`, `deadlineAt` (`committedAt + 72h`), `completedAt` (nullable), `failedRecommitDeadline` (set only once failed).
- A pure function `deriveStatus(task, now)` computes `active | done | failed | pending-deletion` on every read (app foreground, screen focus, or a lightweight interval while the app is open). This makes the system self-correcting even if the app was closed for days — no missed-transition bugs from relying on background jobs firing exactly on time.
- Local notifications are used only for *user-facing alerts*, not as the source of truth for state changes.

## 3. Data model

Single `tasks` table (SQLite):

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (uuid) | primary key |
| `title` | TEXT | user-entered, required |
| `committedAt` | INTEGER (epoch ms) | set once, at commit time |
| `deadlineAt` | INTEGER (epoch ms) | `committedAt + 72h`, recomputed on re-commit |
| `completedAt` | INTEGER, nullable | set when user marks done |
| `failedAt` | INTEGER, nullable | set when `deriveStatus` first observes `now > deadlineAt` with no `completedAt` |
| `autoDeleteAt` | INTEGER, nullable | `failedAt + 72h`, the grace-period boundary |
| `recommitCount` | INTEGER, default 0 | increments each time a failed task is re-committed |
| `notificationsEnabled` | INTEGER (bool) | per-task override; defaults to global setting |

Derived status (`deriveStatus`, not stored):
- `done` — `completedAt` is set
- `active` — no `completedAt`, `now < deadlineAt` (further split into `fresh` / `mid` / `urgent` UI bands by elapsed fraction, per the mockup's thresholds: <35% / 35–75% / ≥75%)
- `failed` — no `completedAt`, `now ≥ deadlineAt`, `now < autoDeleteAt`
- `pending-deletion` (internal only) — `now ≥ autoDeleteAt` → deleted on next app read, not surfaced as a UI state

A separate `settings` table (or a single JSON row) holds: `notificationsEnabledGlobal`, `taskCap` (default 5, stored rather than hardcoded so it's adjustable without a code change per the PRD's "not final" note).

## 4. Core lifecycle logic

`TaskService` (pure, testable, no React/UI dependencies):

- `commit(title)` → rejects if `activeTaskCount >= taskCap`; else inserts row with `committedAt = now`, `deadlineAt = now + 72h`; schedules notifications.
- `complete(taskId)` → sets `completedAt = now`; cancels any pending notifications for that task.
- `recommit(taskId)` → only valid on a `failed` task; resets `committedAt = now`, `deadlineAt = now + 72h`, clears `failedAt`/`autoDeleteAt`, increments `recommitCount`; re-enters the active cap check (a re-commit counts against the 6-task cap like any active task).
- `deleteManually(taskId)` → valid on any task regardless of status; hard delete + cancel notifications.
- `sweep(now)` → run on app foreground/resume and on a light interval while foregrounded: finds tasks that just crossed `deadlineAt` (stamps `failedAt`, schedules the "clock ran out" notification once) and tasks past `autoDeleteAt` (hard deletes them). This is what makes the local-timestamp model self-healing after the app has been closed.

## 5. Notifications

Local, scheduled via `expo-notifications` at the moment a triggering event occurs — no server needed since every trigger time is knowable in advance from `deadlineAt`/`autoDeleteAt`:

| Event | Scheduled at commit/failure time | Cancelled when |
|---|---|---|
| Approaching deadline (e.g. 6h left) | `deadlineAt - 6h` | task completed, deleted, or re-committed before firing |
| Deadline reached / marked failed | `deadlineAt` | task completed before firing |
| Auto-delete warning (e.g. 6h before purge) | `autoDeleteAt - 6h` | task re-committed or manually deleted |

Respect both the global toggle and (optionally) a per-task override. On app foreground, `sweep()` also reconciles: if a scheduled notification's target task no longer exists or already transitioned, cancel stray notifications defensively.

Exact "approaching deadline" lead time (6h used above as a placeholder) — flagged as open below, not a firm decision.

## 6. Screens (maps directly to mockup + PRD §5)

- **Timeline**: subscribes to Zustand store, calls `deriveStatus` per task for rendering; FAB disabled/hidden when `activeTaskCount >= taskCap`.
- **Commit**: on submit, calls `TaskService.commit`; surfaces the cap-reached state explicitly (per PRD §5.2) rather than silently blocking the button.
- **Failed detail**: shows `autoDeleteAt` countdown; "Let it go" → `deleteManually`; "Re-commit" → `recommit`.

## 7. V2 forward-compatibility (informational, not built now)

Per PRD, v2 adds sharing a commitment list with friends — that requires a backend + accounts, which v1 deliberately excludes. To keep that migration additive rather than a rewrite:
- Keep `TaskService` free of any storage-engine assumptions beyond "durable local store with these fields" — swapping/adding a sync layer later shouldn't require rewriting lifecycle logic.
- Use UUIDs (not autoincrement ints) for `id` now, since a synced/shared system will need globally-unique IDs later.
- No other v2-driven work in v1 — avoid speculative backend scaffolding per the "don't design for hypothetical future requirements" bias; the two bullets above are cheap insurance, not a build-out.

## 8. Testing strategy

- Unit test `TaskService` and `deriveStatus` directly (pure functions, no RN dependencies) — this is where the app's actual correctness risk lives (off-by-one clock math, cap enforcement, sweep logic).
- Light component/integration tests for the three screens using React Native Testing Library, focused on: cap-reached UI, failed→recommit flow, notification scheduling calls (mocked).
- No E2E framework (e.g. Detox) recommended for v1 — disproportionate setup cost for a solo hobby project at this scope.

## 9. Resolved (previously open)

- **Notification lead time**: 6h confirmed as the default for both "approaching deadline" and "approaching auto-delete" alerts (§5 placeholder is now final, not provisional).
- **Default notification state**: follow standard platform convention rather than a custom default — `notificationsEnabledGlobal` starts **on** in-app state, but actual delivery is gated by the OS permission prompt (requested at first relevant moment, e.g. right after a user's first commit, not on cold install). This matches both Apple's and Android 13+'s runtime-permission model: the app can't silently enable notifications regardless of its own toggle — the OS prompt is the real gate. If the user denies the OS prompt, the in-app toggle should reflect that (shown as off / "enable in Settings") rather than staying falsely "on."
- **Background sweeping**: confirmed — no `expo-background-fetch` or similar for v1. `sweep()` runs only on app foreground/resume, per §4. Simpler, no extra permissions or battery-usage tradeoffs to manage for a v1 hobby build.
- **Minimum OS versions**: iOS 26 and Android 16. Both are current-generation, so no legacy-version shims or Expo SDK compatibility workarounds are needed — safe to target the latest stable Expo SDK and its newest APIs without fallback paths.
