# Repository Guidelines

## Project Structure & Module Organization

PactPal is an Expo SDK 57 React Native app written in TypeScript. App entry points live at `index.ts` and `App.tsx`. Core lifecycle logic is in `src/task/`, pet state and health logic in `src/pet/`, Zustand stores in `src/store/`, and stateless screens/components in `src/ui/`. Tests sit beside implementation files as `*.test.ts`. Static app images and icons are in `assets/`. Native Android/iOS projects are generated under `android/` and `ios/`; avoid editing them unless the change is native-build specific.

## Build, Test, and Development Commands

- `npm start` starts the Expo dev server.
- `npm run web` runs the app through React Native Web for quick UI checks.
- `npm run android` / `npm run ios` run native Expo builds for the target platform.
- `npm test` runs Jest with the `jest-expo` preset.
- `npx tsc --noEmit` typechecks the project.
- `npm run android:deploy` builds the release APK, uninstalls the app from a connected Android device, and installs the latest APK.

Android native builds require JDK 17. Use `JAVA_HOME=/opt/homebrew/opt/openjdk@17` if your shell defaults to a newer JDK.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Prefer two-space indentation, single-purpose modules, and explicit exported types for domain objects. Name React components in `PascalCase` (`TaskCard.tsx`), hooks/stores in `camelCase` (`themeStore.ts`), and tests after the unit under test (`taskService.test.ts`). There is no lint or Prettier config yet, so match surrounding formatting and run `npx tsc --noEmit` before handing off changes.

## Testing Guidelines

Jest is the test runner. Keep pure logic covered in colocated `*.test.ts` files, especially `src/task/` lifecycle behavior and `src/pet/` health calculations. Prefer deterministic tests that inject time or IDs instead of relying on real clocks or native APIs. Run targeted tests with `npm test -- src/task/taskService.test.ts` and the full suite with `npm test`.

## Commit & Pull Request Guidelines

Recent commits generally use short Conventional Commit-style prefixes such as `feat:`, `refactor:`, and `docs:`. Follow that style when possible: `feat: add failed task recovery state`. Pull requests should include a concise summary, test results, linked issue or product note when relevant, and screenshots or screen recordings for UI changes.

## Architecture Notes

Keep dependencies flowing one way: `src/ui/` calls `src/store/`, stores delegate to pure services in `src/task/` and `src/pet/`. Task status is derived from timestamps at read time; do not persist or trust a stored status as source of truth.
