# Emergency Fallback: Downgrade to Proven Stable Versions

## If the serviceOf error persists, use these KNOWN WORKING versions for Windows:

1. **Edit `package.json` and change these versions:**

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

2. **Then run:**

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json, android
npm install
npx expo prebuild --clean
npx expo run:android
```

## Why this works:

- Expo 50 is more stable on Windows
- React Native 0.73.6 doesn't have the serviceOf issue
- These versions are battle-tested

## When to use this:

- If the fix-gradle-plugin.js script doesn't work
- If you keep getting Kotlin/Gradle errors
- If you just want it to build NOW without debugging

This is a proven stack that works on Windows 11 + Android 14.
