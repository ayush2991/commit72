# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Commit72 is pre-implementation. This repo currently contains product/design artifacts only — no app code, package manager, build system, or tests exist yet. There is nothing to build, lint, or test at this stage.

- `PRD.md` — product requirements: the core mechanic (each committed task starts its own independent 72-hour clock), screen specs, and resolved product decisions (task cap, notifications, failed-task lifecycle, platform targets, v2 scope).
- `TECH_DESIGN.md` — technical design for the planned v1 implementation: recommended stack (React Native + Expo, TypeScript), local-first architecture with no backend, SQLite data model, task lifecycle logic, and notification design. Read this before scaffolding any app code — it defines the architecture future implementation work should follow.
- `index.html` — a self-contained, single-file interactive mockup (built with the `playground` skill pattern: controls + live preview + prompt output) covering the three v1 screens: Timeline, Commit, and Failed detail. Open directly in a browser (`open index.html`); no server or build step needed.

## Core product model (read `PRD.md` for full detail)

The mechanic that differentiates this app from a standard to-do list: committing to a task starts a **per-task** 72-hour countdown (`deadlineAt = committedAt + 72h`). There is no shared/global window — every task has its own independent clock. If a task isn't completed before its clock expires, it becomes a visible **failed** state (not silently rolled over), with a 72-hour grace period to re-commit before auto-deletion.

## Architecture direction (read `TECH_DESIGN.md` for full detail)

When implementation begins, the key architectural principle already decided: **task status must always be derived from stored timestamps at read-time** (`deriveStatus(task, now)`), never trusted from a persisted status field or relied upon via background timers — mobile OSes don't guarantee background execution, so the read path must be self-correcting on every app foreground. Local notifications (via `expo-notifications`) are for user-facing alerts only, not the source of truth for state transitions.

v1 is local-first with no backend/accounts (SQLite via `expo-sqlite`, `zustand` for state, `react-navigation` for the three-screen flow). v2 will add a sharing feature requiring a backend — `TECH_DESIGN.md` §7 notes the minimal forward-compatible choices already made (UUID ids, storage-agnostic `TaskService`) to keep that migration additive.
