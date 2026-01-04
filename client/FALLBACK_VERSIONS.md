# Emergency Fallback: Stable Versions That Work

## When to Use This

If I'm getting endless Kotlin/Gradle errors and just want the damn thing to build, use these **proven stable versions** for Windows 11 + Android 14:

## The Working Stack

Edit `package.json` with these versions:

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.1",
    "expo-build-properties": "~0.11.1",
    "react": "18.2.0",
    "react-native": "0.73.6",
    "@react-navigation/native": "^6.1.6",
    "@react-navigation/native-stack": "^6.9.12",
    "@react-native-async-storage/async-storage": "1.21.0",
    "react-native-screens": "~3.29.0",
    "react-native-safe-area-context": "4.8.2",
    "expo-splash-screen": "~0.26.4"
  }
}
```

Then run:

```powershell
# Clean everything
Remove-Item -Recurse -Force node_modules, package-lock.json, android

# Reinstall
npm install

# Set Java to 17
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Prebuild
npx expo prebuild --clean

# Fix Gradle version
(Get-Content android\gradle\wrapper\gradle-wrapper.properties) -replace 'gradle-8\.14\.3', 'gradle-8.3' | Set-Content android\gradle\wrapper\gradle-wrapper.properties

# Build
npx expo run:android
```

## Why This Works

- **Expo 50** is more stable on Windows than 51
- **React Native 0.73.6** doesn't have the serviceOf issue
- These versions are battle-tested together
- Gradle 8.3 is compatible with this stack

## My Experience

This is what I ended up settling on after trying:
- ❌ Expo 51 + RN 0.74.5 (too new, unstable)
- ❌ Plain RN 0.72.0 (too old for Android 14)
- ✅ Expo 50 + RN 0.73.6 (Goldilocks zone)

## Complete Working Environment

- Windows 11
- Expo 50
- React Native 0.73.6
- Gradle 8.3 (manually set after prebuild)
- Java 17 (Android Studio JBR)
- Android SDK 34

This stack works. Stop messing with versions and just use this.

---

**Last Updated:** January 4, 2026 (after 10 hours of version hell)
