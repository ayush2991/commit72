# Known Bugs

Issues found during code review that are documented but not yet fixed. Fixed
items are removed from this list. Last reviewed: 2026-07-28.

## `themeStore` selection doesn't survive a force-close

`themeStore.ts` (`themeId`, `modePreference`) is a plain in-memory Zustand
store with no persistence, same shape as the `petSelectionStore` bug fixed in
this pass (`petId` reset to `'pip'` on every cold start). Force-closing the
app resets the chosen theme and mode preference back to `'default'`/`'system'`
on next launch. Same fix shape applies: back it with
`src/store/settingsRepository.ts`'s `SQLiteSettingsRepository`, seeding
`themeId`/`modePreference` from stored values and writing through on
`setThemeId`/`setModePreference`. Not fixed here since it wasn't the reported
issue and `themeStore.test.ts` currently exercises the store directly without
an expo-sqlite mock in place.
