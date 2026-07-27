# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

Commit72 ("PactPal") is a commitment-tracking app: a user commits to a task, a clock starts (default 72h, configurable per-task to 24/48/72h), and the task is either completed or becomes `failed` when time runs out. A virtual pet's health rises when tasks are kept and drops when tasks fail, giving the streak mechanic a visible face. See `PRD.md` for product intent and `TECH_DESIGN.md` for the original architecture proposal (some of it — SQLite persistence, `expo-notifications`, `react-navigation` — is planned but not yet implemented; see "Current vs. designed state" below).

## Build, Test, and Development Commands

- `npm start` — starts the Expo dev server.
- `npm run web` — runs the app through React Native Web for quick UI checks.
- `npm run android` / `npm run ios` — native Expo builds for the target platform (requires JDK 17; use `JAVA_HOME=/opt/homebrew/opt/openjdk@17` if your shell defaults to a newer JDK).
- `npm run android:deploy` — builds the release APK, uninstalls the app from a connected Android device, and installs the latest build (`scripts/deploy-android-local.sh`).
- `npm test` — runs Jest (`jest-expo` preset).
- `npm test -- src/task/taskService.test.ts` — run a single test file.
- `npx tsc --noEmit` — typecheck the project; run this before handing off changes (there is no lint/Prettier config).

## Architecture

One-way dependency flow: `src/ui/` → `src/store/` (Zustand) → pure services in `src/task/` and `src/pet/`. UI never talks to services directly, and services never import React or RN.

**Task lifecycle is derive-on-read, not stored.** A `Task` row only stores immutable facts (`committedAt`, `deadlineAt`, `completedAt`, `failedAt`, `autoDeleteAt`, `recommitCount`). `deriveStatus(task, now)` (`src/task/deriveStatus.ts`) is a pure function that computes `done | fresh | mid | urgent | failed` on every read — never trust or persist a status field. This makes the app self-correcting after being closed for any length of time, since there's no reliance on a background timer having fired at the right moment. `TaskService` (`src/task/taskService.ts`) is where all lifecycle transitions live (`commit`, `complete`, `recommit`, `deleteManually`, `sweep`); `sweep()` is what promotes overdue tasks to `failed` and hard-deletes ones past their grace period, and it anchors `failedAt` to the deadline itself (not to sweep time) so a late-opened app doesn't get an extended grace window.

**Storage today is in-memory, not SQLite.** `TaskRepository` (`src/task/taskRepository.ts`) is an interface; `InMemoryTaskRepository` is the only implementation and is not durable across app restarts. `TECH_DESIGN.md` describes a future `expo-sqlite`-backed repository — swapping it in is meant to be a one-line change in `src/store/taskStore.ts` since `TaskService` only depends on the `TaskRepository` interface, never the storage engine.

**Pet health** (`src/pet/petHealth.ts`) is a running score seeded at 58, +18 per kept task, -32 per failed task, clamped to [0, 100], mapped to a `PetMood` (`fading | worried | steady | happy | thriving`) by fixed breakpoints. It has no history beyond the two counters in `petStore.ts` (`kept`/`broken`) — this is intentionally not a windowed/decaying average.

**Stores** (`src/store/`) are thin Zustand wrappers that cache service/repository state for React and re-sync after every mutation:
- `taskStore.ts` owns the single `TaskService`/`InMemoryTaskRepository` instance app-wide, and calls into `petStore` to record kept/broken counts as a side effect of `complete`/`sweep`.
- `petStore.ts` — kept/broken counters.
- `petSelectionStore.ts` / `themeStore.ts` — which pet (`PetId` in `src/ui/pets.ts`) and theme (`ThemeId` in `src/ui/theme.ts`) are active; each pet/theme has its own face component and mood copy.

**Dev-mode time compression:** `taskStore.ts` shrinks the task window to 90 seconds when `__DEV__` is true (real 72h only in release builds), so the full fresh→mid→urgent→failed→auto-deleted lifecycle is watchable in the running app without waiting days. `deriveStatus` is window-agnostic (it reads each task's own `committedAt`/`deadlineAt`), so this is the only place duration is scaled.

**Screens** (`src/ui/`): `TimelineScreen.tsx` (home, task list) and `ProfileScreen.tsx` (pet/theme), switched via local state in `App.tsx` — there is currently no `react-navigation` stack despite `TECH_DESIGN.md` describing one. `App.tsx` also owns the app-wide sweep loop: a 1s interval plus an `AppState` listener that re-sweeps on foreground.

## Coding Style & Naming Conventions

TypeScript, React function components, two-space indentation, single-purpose modules, explicit exported types for domain objects. Components in `PascalCase` (`TaskCard.tsx`), hooks/stores in `camelCase` (`themeStore.ts`), tests named after the unit under test (`taskService.test.ts`) and colocated with the implementation.

## Testing Guidelines

Keep pure logic covered in colocated `*.test.ts` files, especially `src/task/` lifecycle behavior (`taskService.test.ts`, `deriveStatus.test.ts`) and `src/pet/` health calculations (`petHealth.test.ts`). Inject time/IDs (`TaskService` takes `now`/`generateId` options) rather than relying on real clocks or native APIs.

## Commit & Pull Request Guidelines

Use short Conventional Commit-style prefixes (`feat:`, `refactor:`, `docs:`), e.g. `feat: add failed task recovery state`. PRs should include a concise summary, test results, and screenshots/recordings for UI changes.

## Other repo notes

- `android/` and `ios/` are generated (gitignored) — avoid editing unless the change is native-build specific.
- `KNOWN_BUGS.md` tracks open issues found during review; check it and update it when fixing or discovering bugs.
- `mockups-20260712.html` / `index.html` are static HTML mockups used as the visual/design source of truth (theme tokens in `src/ui/theme.ts` are lifted from them) — not part of the app build.
