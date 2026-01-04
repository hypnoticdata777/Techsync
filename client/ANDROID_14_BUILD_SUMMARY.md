# TechSync Android 14 Build - My Journey & Notes

**Date:** January 4, 2026
**Time Spent:** ~10 hours (brutal session)
**Status:** Almost there - one more Gradle cache issue to resolve

---

## What I Was Trying to Do

I'm building TechSync mobile app (React Native + Expo) for Android 14 on my Windows 11 machine using VS Code and Android Studio with the Pixel 5 emulator.

Hit a wall with compatibility issues between:
- React Native versions (started at 0.72.0, ended up at 0.73.6)
- Gradle versions (8.14.3 kept breaking, needed 8.3)
- Java versions (had 24 installed, needed 17)
- Expo SDK versions (tried 51, settled on 50)

**The main problem:** Expo's `prebuild` command regenerates the android directory with Gradle 8.14.3 every time, which is incompatible with React Native 0.73.6 and causes the `serviceOf` error.

**Secondary headache:** Windows + OneDrive file locking keeps corrupting my Gradle caches. Pain.

---

## What I Fixed

### 1. **Downgraded to Stable Versions**
   - Started with: Expo 51 + React Native 0.74.5 (or 0.72.0 locally - had a mismatch)
   - Ended with: Expo 50 + React Native 0.73.6 ✅
   - Changed in: `package.json`

### 2. **Fixed Gradle Version**
   - Before: Gradle 8.14.3 (causes the dreaded `serviceOf` error)
   - After: Gradle 8.3 (actually works with RN 0.73.6) ✅
   - Changed in: `android/gradle/wrapper/gradle-wrapper.properties`
   - **IMPORTANT:** Expo prebuild keeps resetting this back to 8.14.3 - need to fix it AFTER every prebuild

### 3. **Fixed Java Version**
   - Before: Java 24 (incompatible with Gradle 8.3)
   - After: Java 17 from Android Studio's bundled JDK ✅
   - Set via: `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`

### 4. **Fixed React Settings Plugin**
   - Before: Simple plugin declaration that didn't work
   - After: Versioned plugin declaration ✅
   - Changed in: `android/settings.gradle` line 13
   ```gradle
   plugins {
     id("com.facebook.react.settings") version "0.73.6" apply false
   }
   apply plugin: "com.facebook.react.settings"
   ```

### 5. **Fixed hermesEnabled Property**
   - Before: Property was undefined, causing build errors
   - After: Added the property definition ✅
   - Changed in: `android/app/build.gradle` line 28-29

### 6. **Cleaned Gradle Caches Repeatedly**
   - Deleted corrupted cache directories (8.14.3, 8.3, jars-9) multiple times
   - Windows file locking made this a nightmare

---

## Errors I Hit (In Order)

1. ✅ **`Unresolved reference: serviceOf`** → Fixed by downgrading Gradle to 8.3
2. ✅ **Android SDK not found** → Set ANDROID_HOME environment variable
3. ✅ **Unsupported class file major version 68** → Fixed by using Java 17 instead of 24
4. ✅ **Could not get unknown property 'hermesEnabled'** → Added property definition
5. ✅ **Plugin 'com.facebook.react.settings' was not found** → Added version to plugin declaration
6. ✅ **Git conflicts and rebase issues** → Fixed with hard reset
7. ⏳ **Failed to create Jar file in .gradle\caches\jars-9** → THIS IS WHERE I'M AT NOW

---

## Current Error (The Last Boss)

**Error:**
```
java.util.concurrent.ExecutionException: org.gradle.api.GradleException:
Failed to create Jar file C:\Users\enchi\.gradle\caches\jars-9\e2bd16e4cda510fb4d66b8da1b8bc13f\dsl.jar
```

**Why:** Corrupted Gradle cache in the `jars-9` directory (probably OneDrive syncing or file locking BS).

**The Fix:** Nuke the entire Gradle cache directory.

---

## What I Need to Do Next

When I come back to this (probably tomorrow because it's almost 8pm):

```powershell
# 1. Stop all Gradle processes
cd android
.\gradlew --stop
cd ..

# 2. Delete the ENTIRE Gradle cache (nuclear option but whatever)
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction SilentlyContinue

# 3. Set JAVA_HOME to Android Studio's JDK 17
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# 4. Verify gradle-wrapper.properties is still set to 8.3
Get-Content android\gradle\wrapper\gradle-wrapper.properties | Select-String "distributionUrl"
# Should show: gradle-8.3-all.zip

# 5. Start Pixel 5 emulator in Android Studio

# 6. Build the app
npx expo run:android
```

---

## Files I Modified

All changes committed to branch: `claude/fix-android-14-compatibility-NYdt5`

1. **package.json** - Downgraded to Expo 50 + RN 0.73.6
2. **android/gradle/wrapper/gradle-wrapper.properties** - Set to Gradle 8.3
3. **android/settings.gradle** - Fixed React settings plugin configuration
4. **android/app/build.gradle** - Added hermesEnabled property
5. **app.json** - Configured Android SDK 34 settings

---

## Lessons Learned (The Hard Way)

### 1. **The Prebuild Loop is a Trap**
- Every time I run `npx expo prebuild --clean`, it regenerates the android directory
- This RESETS gradle-wrapper.properties back to 8.14.3
- **Solution:** After prebuild, ALWAYS run this:
  ```powershell
  (Get-Content android\gradle\wrapper\gradle-wrapper.properties) -replace 'gradle-8\.14\.3', 'gradle-8.3' | Set-Content android\gradle\wrapper\gradle-wrapper.properties
  ```

### 2. **Windows + OneDrive = Hell**
- OneDrive sync and file locking cause Gradle cache corruption
- **Solution:** Aggressively delete cache directories when shit breaks

### 3. **Java Version Actually Matters**
- Gradle 8.3 requires Java 17, not Java 24
- **Solution:** Point JAVA_HOME to Android Studio's bundled JDK every session

### 4. **The Version Compatibility Chain**
- Android 14 → requires SDK 34
- SDK 34 → requires React Native 0.73.6+
- RN 0.73.6 → works with Gradle 8.3
- Gradle 8.3 → requires Java 17

Everything's connected. Break one link, break the whole chain.

---

## Optional: Make JAVA_HOME Permanent

To avoid setting JAVA_HOME every damn session:

1. Windows Search → "Environment Variables"
2. System Properties → Environment Variables
3. Under "System variables" → New
4. Variable name: `JAVA_HOME`
5. Variable value: `C:\Program Files\Android\Android Studio\jbr`
6. OK → Apply

Same for ANDROID_HOME:
- Variable name: `ANDROID_HOME`
- Variable value: `C:\Users\enchi\AppData\Local\Android\Sdk` (or wherever it is)

---

## What Success Looks Like

When this finally works, I should see:
```
BUILD SUCCESSFUL
Installing APK on Pixel 5...
App installed successfully
Starting app...
```

Then TechSync should launch on the emulator. 🚀

---

## If It Still Fails

If I get a different error after clearing the cache:
1. Screenshot it
2. Check if it's new or the same error
3. Google the exact error message
4. Common next errors might be:
   - Missing dependencies → Run `npm install`
   - Emulator not detected → Restart emulator
   - Network issues → Check firewall/VPN

---

## Git Status

**Branch:** `claude/fix-android-14-compatibility-NYdt5`

**Recent Commits:**
- `d16eb18` - Downgrade to Expo 50 + React Native 0.73.6 for stability
- `df06dd5` - Fix React settings plugin configuration for RN 0.73.6
- `84b5601` - Downgrade Gradle to 8.3 for React Native 0.73.6 compatibility
- `da6f559` - Fix hermesEnabled property definition in build.gradle

All committed and pushed ✅

---

## Current Status

I'm 99% there. The app configuration is correct:
- ✅ React Native 0.73.6
- ✅ Gradle 8.3
- ✅ Java 17
- ✅ Expo SDK 50
- ✅ Android directory properly configured

Only issue left is a corrupted cache file. It's a Windows/Gradle quirk, not a fundamental problem with the setup.

That one command to delete the entire Gradle cache should fix it when I come back.

---

**Next Session Checklist:**
- [ ] Delete entire Gradle cache
- [ ] Set JAVA_HOME to Java 17
- [ ] Verify gradle-wrapper.properties = 8.3
- [ ] Start Pixel 5 emulator
- [ ] Run `npx expo run:android`
- [ ] 🎉 Finally see this thing work

---

**Note to self:** Been at this since 10am. It's almost 8pm. Take a break. You got this tomorrow.
