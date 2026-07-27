#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
APP_ID="${APP_ID:-com.aayushagarwal.pactpal}"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
GRADLE_ARGS=("${GRADLE_ARGS:-assembleRelease}")

if ! command -v adb >/dev/null 2>&1; then
  echo "adb was not found. Install Android platform-tools or add adb to PATH." >&2
  exit 1
fi

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "Android project directory not found at $ANDROID_DIR." >&2
  exit 1
fi

if [[ ! -x "$ANDROID_DIR/gradlew" ]]; then
  echo "Gradle wrapper is missing or not executable at $ANDROID_DIR/gradlew." >&2
  exit 1
fi

if [[ ! -d "$JAVA_HOME" ]]; then
  echo "JDK 17 was not found at JAVA_HOME=$JAVA_HOME." >&2
  echo "Set JAVA_HOME to a JDK 17 install before running this script." >&2
  exit 1
fi

device_count="$(adb devices | awk 'NR > 1 && $2 == "device" { count++ } END { print count + 0 }')"

if [[ "$device_count" -eq 0 ]]; then
  echo "No authorized Android device found. Connect your phone and enable USB debugging." >&2
  adb devices >&2
  exit 1
fi

if [[ "$device_count" -gt 1 && -z "${ANDROID_SERIAL:-}" ]]; then
  echo "More than one Android device is connected. Set ANDROID_SERIAL to choose one." >&2
  adb devices >&2
  exit 1
fi

echo "Building latest release APK..."
(
  cd "$ANDROID_DIR"
  JAVA_HOME="$JAVA_HOME" ./gradlew "${GRADLE_ARGS[@]}"
)

if [[ ! -f "$APK_PATH" ]]; then
  echo "Expected APK not found at $APK_PATH." >&2
  exit 1
fi

echo "Uninstalling $APP_ID if present..."
if adb shell pm list packages "$APP_ID" | grep -q "^package:$APP_ID$"; then
  adb uninstall "$APP_ID"
else
  echo "$APP_ID is not currently installed."
fi

echo "Installing $APK_PATH..."
adb install "$APK_PATH"

echo "Installed $APP_ID from:"
echo "$APK_PATH"
