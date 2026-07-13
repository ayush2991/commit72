# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Commit72 is an Expo (React Native + TypeScript) app in early implementation. Working today: the pure lifecycle logic in `src/task/`, and a first UI slice — a single **Timeline** screen (`src/ui/`) wired to a `zustand` store (`src/store/`) that owns a `TaskService`. Committing (via a modal off the FAB), completing, re-committing, deleting, and the timed fresh→mid→urgent→failed→auto-deleted progression all work on screen.

Not yet built: navigation (there is no `react-navigation` yet — the Commit and Failed flows from the mockup are a modal / `Alert` rather than routes), and real persistence (still `InMemoryTaskRepository`; the `expo-sqlite`-backed `TaskRepository` is unwritten, so **tasks reset on reload**).

- `PRD.md` — product requirements: the core mechanic, screen specs, resolved product decisions (task cap, notifications, failed-task lifecycle, platform targets, v2 scope).
- `TECH_DESIGN.md` — technical design and **source of truth for architecture decisions**: stack, local-first no-backend architecture, SQLite data model, lifecycle logic, notification design.
- `index.html` — a self-contained interactive mockup of the three v1 screens (Timeline, Commit, Failed detail). The app's `src/ui/theme.ts` design tokens are lifted from it. Open directly (`open index.html`); no build step.
- `KNOWN_BUGS.md` — reviewed-but-unfixed issues (repository lacks `getById`, `complete()` lifecycle gaps, `getAll()` reference leak). Remove entries here when you fix them.

**Expo version directive:** this is Expo **SDK 57** (`expo ~57.0.4`), whose APIs differ from older majors. Read the version-pinned docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo/RN code; do not rely on memory of earlier SDKs.

## Commands

- `npm start` — Expo dev server (then pick a platform from the CLI menu).
- `npm run ios` / `npm run android` / `npm run web` — target a platform directly. `ios`/`android` run `expo run:ios`/`expo run:android` — a **native build** (prebuilds and compiles via Xcode/Gradle), not just the Metro dev server, so they need Xcode/Android Studio installed and, for Android, JDK 17 (see below). `web` renders via `react-native-web` (installed) and is the fastest way to eyeball the UI without a simulator or native toolchain; note web maps `Alert.alert` to `window.confirm` and no-ops `KeyboardAvoidingView`, so use `ios` for true-to-mockup fidelity.
- `npm test` — Jest (`jest-expo` preset). Single file: `npm test -- src/task/taskService.test.ts`.
- `npx tsc --noEmit` — typecheck.

No lint config is set up yet.

### Native Android/iOS builds require JDK 17

Building a native APK (`npx expo prebuild` + `./android/gradlew assembleRelease`, or `expo run:android`) **must use JDK 17** — set `JAVA_HOME=/opt/homebrew/opt/openjdk@17` for the build. A newer JDK (24+) fails the CMake configure step (`:app:configureCMakeRelWithDebInfo` → `WARNING: A restricted method in java.lang.System has been called`) because JEP 472 restricts the native-method calls the RN/Expo native build relies on. If Gradle was previously run under another JDK, stop the stale daemon first (`./android/gradlew --stop`). The Metro/QR-code dev flow (`npm start`, Expo Go) does not need the JDK and is unaffected. The built release APK lives at `android/app/build/outputs/apk/release/app-release.apk`; install with `adb install -r`.

### Dev clock

In dev builds (`__DEV__`), `src/store/taskStore.ts` passes a compressed `windowMs` (90s) to `TaskService` so the whole lifecycle plays out in ~3 minutes instead of 72h+72h. Release builds omit it and get the real 72h default. This is data-only compression — nothing in the logic or formatters hardcodes 72h, so a 90s task and a 72h task are indistinguishable to the code (see the read-time-derivation principle below).

## Core product model (read `PRD.md` for full detail)

The mechanic that differentiates this app from a standard to-do list: committing to a task starts a **per-task** 72-hour countdown (`deadlineAt = committedAt + 72h`). There is no shared/global window — every task has its own independent clock. If a task isn't completed before its clock expires, it becomes a visible **failed** state (not silently rolled over), with a 72-hour grace period to re-commit before auto-deletion.

## Architecture direction (read `TECH_DESIGN.md` for full detail)

The key architectural principle: **task status must always be derived from stored timestamps at read-time** (`deriveStatus(task, now)`), never trusted from a persisted status field or relied upon via background timers — mobile OSes don't guarantee background execution, so the read path must be self-correcting on every app foreground (`sweep()`, run on foreground/resume only — no background-fetch task in v1). Local notifications (via `expo-notifications`) are for user-facing alerts only, not the source of truth for state transitions.

v1 is local-first with no backend/accounts (SQLite via `expo-sqlite`, `zustand` for state, `react-navigation` planned for the three-screen flow but not yet added). v2 will add a sharing feature requiring a backend — `TECH_DESIGN.md` §7 notes the forward-compatible choices already made (UUID ids, storage-agnostic `TaskService`) to keep that migration additive.

### Layering (strict, one direction)

```
src/ui/  ──reads/calls──▶  src/store/taskStore.ts  ──delegates──▶  src/task/TaskService  ──▶  TaskRepository
 (dumb views)              (zustand: cache + tick)    (pure logic, no React)      (InMemoryTaskRepository today)
```

- **`src/task/`** is pure, React-free lifecycle logic. `TaskService` (`taskService.ts`) depends only on the `TaskRepository` interface (`taskRepository.ts`), never a concrete engine — so swapping `InMemoryTaskRepository` for the SQLite adapter is a one-line change in the store and touches nothing else. Tests target the interface for this reason. Ids come from `id.ts` (`expo-crypto`'s RFC 4122 `randomUUID()`).
- **`src/store/taskStore.ts`** owns the single `TaskService` instance. The store is a *cache* of the service: every action (`commit`/`complete`/`recommit`/`remove`/`sweep`) calls the service, then re-pulls `repository.getAll()` into `tasks`. It never trusts a status field. Note `jest-expo` mocks `expo-crypto`, so `TaskService` tests inject their own `generateId`/`now` via `TaskServiceOptions` rather than using the real (native, unmockable-in-Jest) sources.
- **`src/ui/`** are stateless views. `TaskCard` re-derives status/countdown/progress from `now` at render — it holds no state.

### Two things drive re-renders

`deriveStatus(task, now)` is pure, so React only re-reads derived state when **`now` advances**. `App.tsx` runs a 1s `setInterval(sweep)` whose real job is to bump `store.now` so cards visibly tick fresh→urgent; `sweep()` also persists the failed/auto-delete transitions. It also re-runs `sweep()` on `AppState` → `active`, the authoritative self-heal after the OS suspended the app — this is *why* the principle above insists status be re-derivable rather than timer-dependent. (Note: `App.tsx` currently sweeps on the tick as well as on foreground; harmless while foregrounded, but the design's canonical rule is foreground-only.)

Minimum OS targets: iOS 26, Android 16 — no legacy-version compatibility shims needed.
