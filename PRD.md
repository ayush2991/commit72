# Commit72 — Product Requirements Document

## 1. Problem

Most task/planning tools optimize for capturing everything you *might* do, indefinitely. That flexibility is exactly what enables procrastination — tasks can always be pushed to "later" with no real cost. Commit72 is built around the opposite premise: planning should be short-horizon and binding. You commit to a task, a 72-hour clock starts, and there is a real, visible consequence if it isn't done in time.

## 2. Goals

- Make committing to a task feel like a deliberate act, not a low-friction to-do add.
- Create real stakes: an expired commitment is a visible failure, not a silent rollover.
- Keep the system simple enough that the "next 72 hours" framing is always legible at a glance.

## 3. Non-goals (for v1)

- Not a general-purpose to-do list or project management tool (no projects, tags, sub-tasks, or long-range planning).
- Not a social/accountability network in v1 — no sharing, followers, or public commitments. Planned for v2 (see Decisions).
- Not optimizing for exhaustive task capture — the app should resist becoming a backlog.

## 4. Core Concept: The Per-Task 72-Hour Clock

This is the central mechanic and the main differentiator from a standard to-do app:

- **Committing starts a clock.** The moment a user commits to a task, its deadline is fixed at `commit_time + 72h`.
- **Clocks are independent, not shared.** There is no single global "window" that resets — the app's frame of reference is always "now," and every committed task carries its own countdown. A task committed Tuesday at 9am and one committed Wednesday at 3pm expire at different times.
- **No sub-scheduling.** Tasks don't have deadlines or times within their own window — just a title and a commit action. This keeps entry fast and keeps the focus on the binary outcome: done or failed.
- **Expiry is visible, not silent.** If a task's clock reaches zero without being marked done, it becomes a **failed** task. Failed tasks remain visible in the app (not deleted, not quietly rolled into a new commitment) until the user explicitly acts on them (re-commit or release).

## 5. Primary Screens (v1)

### 5.1 Timeline (home screen)
The default view. Shows all currently active committed tasks as cards, each displaying:
- Task title
- An urgency state derived from elapsed time toward its own deadline: **Fresh** (<35% elapsed), **In Progress** (35–75%), **Urgent** (75–100%), **Failed** (≥100%, incomplete)
- A per-task progress bar and a countdown ("Xh left")
- A floating action button to start a new commitment, disabled/hidden once the user has 5 active commitments (the v1 cap — see Decisions)

Design intent: urgency should be immediately readable through color and motion, not just numbers — this screen is the emotional core of the app.

### 5.2 Commit (add-task flow)
The entry point for creating a new commitment:
- Single text field for the task title
- A prominent "72:00" countdown preview, reinforcing that the clock starts immediately on commit
- Explicit copy stating the commitment cannot be paused, extended, or rescheduled
- A single confirm action: "Commit for 72 Hours"
- If the user is already at the 5-task cap, this flow should make that constraint clear rather than silently failing

Design intent: this should read as a deliberate, slightly weighty action — not a quick-add text field.

### 5.3 Failed task detail
Shown when a user opens a task whose clock has expired:
- Clear "clock ran out" framing
- Task detail: committed time, deadline, status
- A visible countdown that the failed task will be **auto-deleted in 72 hours** if left untouched
- Two actions: **Let it go** (delete immediately) or **Re-commit, 72h** (start a fresh clock for the same task)
- Manual delete is available on any task, active or failed, at any time (not only from this screen)

Design intent: failure is acknowledged plainly, without shame-based language, but is not hidden or auto-resolved. The 72h grace period gives a bounded window to decide without letting failed tasks accumulate indefinitely.

## 6. Reference Mockup

A static/interactive HTML mockup covering all three screens (with viewport, accent color, task count, and failed-state toggles) lives at `index.html` in this project directory. It reflects the visual language (dark theme, bold typography, mono countdown numerals, red-orange urgency accent) intended for v1.

## 7. Decisions

- **Task cap**: 5 simultaneously active commitments, as a starting point. Not validated against real usage yet — treat as adjustable, not final.
- **Notifications**: supported, user-controlled. Users can enable/disable push notifications (e.g. as a clock approaches expiry); default on/off state still TBD.
- **Failed-task lifecycle**: once a task fails, the user has 72 hours to either re-commit (starts a fresh 72h clock) or it is automatically deleted. A user can also manually delete any task — active or failed — at any time. This bounds how long failed tasks linger and keeps the failed-state list from growing unbounded.
- **Platform**: targeting both iOS and Android. Exact implementation approach (native per-platform vs. cross-platform framework) not yet decided.
- **Accountability/social layer**: out of scope for v1. Planned for v2 — users will be able to share their commitment list with friends for a fixed duration or until manually disabled. Needs its own design pass when scoped (visibility of failed tasks, whether sharing is read-only, etc.).

## 8. Open Questions (still unresolved)

- Default on/off state for notifications, and which events trigger them (e.g. only "approaching deadline," or also "just failed," "auto-deleted").
- Whether the 5-task cap should differ once the v2 sharing feature exists (e.g. does a shared list have different constraints).
- Native vs. cross-platform framework decision for iOS/Android.
- Failed-task-at-scale: even with 72h auto-deletion, is a review/reflection surface needed, or is the per-task detail screen sufficient?

## 9. Success Signals (draft, needs validation)

- % of committed tasks marked done before expiry (the core health metric of the app).
- Time-to-commit after opening the commit screen (proxy for whether the commit flow feels appropriately deliberate vs. friction-heavy).
- Re-commit rate on failed tasks (signals whether failure is motivating re-engagement vs. causing abandonment).
