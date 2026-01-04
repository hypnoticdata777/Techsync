# Windows Build Fix - serviceOf Error

## The Error I Was Getting

```
Unresolved reference: serviceOf
```

This is a compatibility issue with `@react-native/gradle-plugin` and newer Gradle versions.

## How I Fixed It

### Main Fix: Downgrade Gradle

The cleanest solution (what I ended up doing):

1. **Edit `android/gradle/wrapper/gradle-wrapper.properties`:**
   - Change: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-all.zip`
   - To: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip`

2. **Use Java 17 (not Java 24):**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   ```

3. **Build:**
   ```powershell
   npx expo run:android
   ```

### The Problem with Expo Prebuild

Every time I run `npx expo prebuild --clean`, it regenerates the android directory with Gradle 8.14.3, which breaks everything.

**My workflow now:**
```powershell
# 1. Run prebuild
npx expo prebuild --clean --platform android

# 2. Immediately fix the Gradle version
(Get-Content android\gradle\wrapper\gradle-wrapper.properties) -replace 'gradle-8\.14\.3', 'gradle-8.3' | Set-Content android\gradle\wrapper\gradle-wrapper.properties

# 3. Verify
Get-Content android\gradle\wrapper\gradle-wrapper.properties | Select-String "distributionUrl"

# 4. Build
npx expo run:android
```

## Alternative: Manual Node Modules Fix

If I ever need to patch the gradle plugin directly:

1. Open: `node_modules/@react-native/gradle-plugin/build.gradle.kts`
2. Line 10: Comment out `// import org.gradle.configurationcache.extensions.serviceOf`
3. Line 45: Replace `serviceOf<ModuleRegistry>()` with `gradle.sharedServices.registrations.getByName("ModuleRegistry").service.get()`
4. Save and rebuild

**(But honestly, just downgrading Gradle is easier)**

## Verify Setup Before Building

1. **Android Emulator is running:**
   ```powershell
   adb devices
   ```

2. **ANDROID_HOME is set:**
   ```powershell
   echo $env:ANDROID_HOME
   ```

3. **JAVA_HOME is Java 17:**
   ```powershell
   echo $env:JAVA_HOME
   java -version
   ```

## Common Issues I Hit

### Gradle cache corruption
- Symptoms: Random "Could not read workspace metadata" errors
- Fix: Delete entire cache
  ```powershell
  Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction SilentlyContinue
  ```

### OneDrive file locking
- Symptoms: Can't delete files, build fails randomly
- Fix: Close OneDrive temporarily or exclude project folder from sync

### Wrong Java version
- Symptoms: "Unsupported class file major version 68"
- Fix: Point JAVA_HOME to Android Studio's JDK 17

## My Current Working Setup

- Windows 11
- Expo 50 + React Native 0.73.6
- Gradle 8.3
- Java 17 (Android Studio JBR)
- Android SDK 34

---

**Note:** See `ANDROID_14_BUILD_SUMMARY.md` for the full story of how I got here.
