# Windows Build Fix for serviceOf Error

## The Problem

You're seeing this error when trying to build:
```
Unresolved reference: serviceOf
```

This is a known compatibility issue with `@react-native/gradle-plugin` and Gradle 8.8.

## Quick Fix (Run These Commands)

### Option 1: Automated Fix (Recommended)

Open PowerShell or Command Prompt in VS Code:

```powershell
# Navigate to client folder
cd "C:\Users\enchi\OneDrive\Escritorio\Coding Practices\Techsync\client"

# Clean everything
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue

# Reinstall
npm install

# Apply the fix
node fix-gradle-plugin.js

# Regenerate Android
npx expo prebuild --clean --platform android

# Build
npx expo run:android
```

### Option 2: Manual Fix

If the automated script doesn't work:

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Manually edit the problematic file:**
   - Open: `node_modules/@react-native/gradle-plugin/build.gradle.kts`
   - Find line 10: `import org.gradle.configurationcache.extensions.serviceOf`
   - Comment it out: `// import org.gradle.configurationcache.extensions.serviceOf`
   - Find line 45: `serviceOf<ModuleRegistry>()`
   - Replace with: `gradle.sharedServices.registrations.getByName("ModuleRegistry").service.get()`
   - Save the file

3. **Regenerate Android:**
   ```powershell
   npx expo prebuild --clean --platform android
   ```

4. **Build:**
   ```powershell
   npx expo run:android
   ```

## Alternative: Use Older Gradle Version

If the above doesn't work, we can downgrade Gradle:

1. Edit `android/gradle/wrapper/gradle-wrapper.properties`
2. Change: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.8-all.zip`
3. To: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip`
4. Run: `npx expo run:android`

## Alternative: Use React Native CLI Instead

If Expo continues to cause issues:

```powershell
# Build with React Native CLI directly
cd android
.\gradlew.bat assembleDebug

# Install on emulator
adb install app\build\outputs\apk\debug\app-debug.apk

# Start Metro bundler in another terminal
cd ..
npx react-native start
```

## Verify Your Setup

Before building, verify:

1. **Android Emulator is running:**
   ```powershell
   adb devices
   ```
   You should see your emulator listed.

2. **ANDROID_HOME is set:**
   ```powershell
   echo $env:ANDROID_HOME
   ```
   Should show your Android SDK path.

3. **Java is installed:**
   ```powershell
   java -version
   ```
   Should show Java 17 or higher.

## Still Not Working?

If you're still getting errors:

1. **Check the full error output** - scroll up in the terminal to see the complete error
2. **Look for different errors** - the serviceOf error should be gone, but there might be new issues
3. **Check Android Studio** - make sure Android SDK is fully installed
4. **Try a simple Expo project** - to verify your environment:
   ```powershell
   cd ..
   npx create-expo-app test-app
   cd test-app
   npx expo run:android
   ```

## Contact Support

If none of this works, the issue might be:
- Missing Android SDK components
- Java version incompatibility
- Windows permissions issues
- Antivirus blocking Gradle

Please share:
1. The full terminal output
2. Your Java version: `java -version`
3. Your Android SDK location
4. Any antivirus software you're using
