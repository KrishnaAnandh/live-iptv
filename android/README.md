# StreamDeck TV — Android / Google TV

Native Kotlin app for Google TV and Android TV, built with Jetpack Compose for TV and Media3 ExoPlayer.

## Requirements

- JDK 17+
- Android SDK (API 35)
- Android TV emulator or Google TV device

## Build

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

cd android
./gradlew assembleDebug
```

Debug APK output:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Run on Android TV Emulator

1. Create an Android TV (1080p) AVD in Android Studio Device Manager.
2. Start the emulator.
3. Install and launch:

```bash
./gradlew installDebug
adb shell am start -n tv.streamdeck/.MainActivity
```

## Run on Google TV / Chromecast with Google TV

Enable developer options and USB debugging (or use `adb connect <ip>` over network), then:

```bash
./gradlew installDebug
```

The app appears on the TV home screen under **Apps** (leanback launcher).

## Release build (sideload)

Generate an unsigned release APK:

```bash
./gradlew assembleRelease
```

For distribution, create a keystore and configure signing in `app/build.gradle.kts`:

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("release.keystore")
        storePassword = "..."
        keyAlias = "streamdeck"
        keyPassword = "..."
    }
}
buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

Then build an App Bundle for Play Console:

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

## Play Store notes

This app streams third-party IPTV sources from [iptv-org](https://github.com/iptv-org/iptv). Google Play may reject apps that redistribute unlicensed live TV. Recommended paths:

- **Sideload** the signed APK/AAB to your own devices.
- **Enterprise / internal testing** track if you have Play Console access.
- Future: allow user-provided M3U URLs to reduce policy risk.

## TV remote controls

| Key | Action |
|-----|--------|
| D-pad Down | Open channel quick list |
| D-pad Down (in list) | Open full grid |
| D-pad Left / Right | Previous / next channel (player) or move selection (overlay) |
| D-pad Up / Back | Close overlay |
| Center / Enter | Select channel in overlay |
| Play/Pause | Toggle playback |

## Project structure

```
app/src/main/java/tv/streamdeck/
  data/          M3U parser, channel repository, favorites (DataStore)
  player/        ExoPlayer wrapper
  ui/            Compose screens and overlays
  viewmodel/     App and player view models
```

## Tests

```bash
./gradlew test
```

Unit tests cover M3U parsing (`M3uParserTest`).
