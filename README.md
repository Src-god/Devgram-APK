# Devgram

Devgram is a black-and-white Telegram-style Android companion app, remastered by Dev.

## Included

- App-open PIN gate: `709177`
- Force-join onboarding for `@tech_zone_dev` and `@high_table_dev`
- Safe Bot Manager with up to 10 local slots
- Feature PIN gate: `56530`
- Group panel for public group links, group title updates, thread-aware text messages, fancy formatting, and start/stop state
- Always-visible Gramify bubble with outside-tap close behavior
- Gramify music search state and fixed equalizer toggle
- Devgram logo and branding: “Remastered by Dev” and “Developed by Dev 🫍”

## Run

```bash
pnpm install
pnpm exec expo start
```

Use Expo Go for device preview. The app stores bot slot values locally on the device and does not send them to a Devgram server.

## Android release build

This source is ready for a local Android release build on a machine with the Android SDK and Gradle available:

```bash
pnpm exec expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK is emitted under `android/app/build/outputs/apk/release/`.