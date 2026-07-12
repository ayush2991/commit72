# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Commit72 is an Expo (React Native + TypeScript) app, early in implementation. `App.tsx` is still the default template screen — no product UI has been built yet. The first implemented piece is `src/task/` — `TaskService`, the pure lifecycle/business logic — independent of the UI, per the plan in `TECH_DESIGN.md`. Persistence is still in-memory (`InMemoryTaskRepository`); the `expo-sqlite`-backed `TaskRepository` implementation has not been written yet.

- `PRD.md` — product requirements: the core mechanic (each committed task starts its own independent 72-hour clock), screen specs, and resolved product decisions (task cap, notifications, failed-task lifecycle, platform targets, v2 scope).
- `TECH_DESIGN.md` — technical design: stack (React Native + Expo, TypeScript), local-first architecture with no backend, SQLite data model, task lifecycle logic, and notification design. Treat this as the source of truth for architecture decisions during implementation.
- `index.html` — a self-contained, single-file interactive mockup (controls + live preview + prompt output) covering the three v1 screens: Timeline, Commit, and Failed detail. Open directly in a browser (`open index.html`); no server or build step needed.

## Commands

- `npm start` — start the Expo dev server (then choose iOS simulator, Android emulator, or web from the Expo CLI menu).
- `npm run ios` / `npm run android` / `npm run web` — start the dev server targeting a specific platform directly.
- `npm test` — run the Jest (`jest-expo` preset) test suite. Run a single file with `npm test -- src/task/taskService.test.ts`.
- `npx tsc --noEmit` — typecheck.

No lint config is set up yet.

## Core product model (read `PRD.md` for full detail)

The mechanic that differentiates this app from a standard to-do list: committing to a task starts a **per-task** 72-hour countdown (`deadlineAt = committedAt + 72h`). There is no shared/global window — every task has its own independent clock. If a task isn't completed before its clock expires, it becomes a visible **failed** state (not silently rolled over), with a 72-hour grace period to re-commit before auto-deletion.

## Architecture direction (read `TECH_DESIGN.md` for full detail)

The key architectural principle: **task status must always be derived from stored timestamps at read-time** (`deriveStatus(task, now)`), never trusted from a persisted status field or relied upon via background timers — mobile OSes don't guarantee background execution, so the read path must be self-correcting on every app foreground (`sweep()`, run on foreground/resume only — no background-fetch task in v1). Local notifications (via `expo-notifications`) are for user-facing alerts only, not the source of truth for state transitions.

v1 is local-first with no backend/accounts (SQLite via `expo-sqlite`, `zustand` for state, `react-navigation` for the three-screen flow: Timeline → Commit → Failed detail). v2 will add a sharing feature requiring a backend — `TECH_DESIGN.md` §7 notes the minimal forward-compatible choices already made (UUID ids, storage-agnostic `TaskService`) to keep that migration additive.

`TaskService` (`src/task/taskService.ts`) depends only on a `TaskRepository` interface (`src/task/taskRepository.ts`), not a concrete storage engine — the current `InMemoryTaskRepository` is a stand-in for the eventual SQLite adapter, and tests are written against the interface for that reason.

Minimum OS targets: iOS 26, Android 16 — no legacy-version compatibility shims needed.
