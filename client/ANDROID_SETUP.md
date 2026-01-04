# Android SDK Setup - My Notes

## The Issue

Build can't find the Android SDK because ANDROID_HOME environment variable isn't set.

## My Solution (Windows 11)

### Finding My Android SDK Location

1. Open Android Studio
2. Go to **File** → **Settings**
3. Navigate to **Appearance & Behavior** → **System Settings** → **Android SDK**
4. Copy the path (mine is: `C:\Users\enchi\AppData\Local\Android\Sdk`)

### Setting Environment Variables

**Option A: Current Session Only (Quick Fix)**
```powershell
# In PowerShell
$env:ANDROID_HOME = "C:\Users\enchi\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

**Option B: Permanent (What I Should Do)**
1. Press `Win + X` → select **System**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under **User variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\enchi\AppData\Local\Android\Sdk`
5. Click **OK**
6. Find **Path** in User variables, click **Edit**
7. Click **New** and add: `%ANDROID_HOME%\platform-tools`
8. Click **New** and add: `%ANDROID_HOME%\tools`
9. Click **OK** on all dialogs
10. **Restart VS Code** for changes to take effect

### Same for JAVA_HOME
- Variable name: `JAVA_HOME`
- Variable value: `C:\Program Files\Android\Android Studio\jbr`

### Verify ADB is Accessible

```bash
adb version
```

## Using Pixel 5 Emulator

1. **Start emulator** from Android Studio:
   - Tools → Device Manager
   - Click Play button next to Pixel 5
   - Wait for it to boot

2. **Verify it's running:**
   ```bash
   adb devices
   ```
   Should see my emulator listed (like `emulator-5554`)

3. **Run my app:**
   ```bash
   cd C:\Users\enchi\OneDrive\Escritorio\Coding Practices\Techsync\client
   npx expo run:android
   ```

## Alternative: Build Directly with Gradle

If environment variables are still problematic:

```bash
cd android
.\gradlew assembleDebug
```

Then install manually:
```bash
adb install app\build\outputs\apk\debug\app-debug.apk
```

## Troubleshooting

### "SDK location not found"
- Make sure Android Studio SDK is fully installed
- Check that the SDK path exists
- Verify environment variables are correct

### "adb: command not found"
- Make sure platform-tools are in PATH
- Try full path: `C:\Users\enchi\AppData\Local\Android\Sdk\platform-tools\adb.exe`

### Emulator not detected
- Start emulator from Android Studio first
- Run `adb devices` to verify
- Try `adb kill-server` then `adb start-server`

---

**My Setup:**
- Windows 11
- Android Studio with Pixel 5 emulator (Android 14)
- VS Code for development
- Java 17 (from Android Studio JBR)
- Gradle 8.3
