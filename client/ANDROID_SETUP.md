# Android SDK Setup for TechSync

## Issue
The build cannot find the Android SDK. This is because the ANDROID_HOME environment variable is not set.

## Solution

### For Windows 11 (Your System)

1. **Find your Android SDK location:**
   - Open Android Studio
   - Go to **File** → **Settings** (or **Configure** → **Settings** from welcome screen)
   - Navigate to **Appearance & Behavior** → **System Settings** → **Android SDK**
   - Copy the **Android SDK Location** path (usually something like `C:\Users\YourName\AppData\Local\Android\Sdk`)

2. **Set Environment Variables:**

   **Option A: Set for current terminal session (temporary):**
   ```bash
   # In PowerShell or Command Prompt
   set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
   set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
   ```

   **Option B: Set permanently (recommended):**
   1. Press `Win + X` and select **System**
   2. Click **Advanced system settings**
   3. Click **Environment Variables**
   4. Under **User variables**, click **New**
   5. Variable name: `ANDROID_HOME`
   6. Variable value: `C:\Users\YourName\AppData\Local\Android\Sdk` (your actual path)
   7. Click **OK**
   8. Find **Path** in User variables, click **Edit**
   9. Click **New** and add: `%ANDROID_HOME%\platform-tools`
   10. Click **New** and add: `%ANDROID_HOME%\tools`
   11. Click **OK** on all dialogs
   12. **Restart VS Code** for changes to take effect

3. **Verify ADB is accessible:**
   ```bash
   adb version
   ```

### For VS Code Terminal

If you're using VS Code with WSL or Git Bash, you may need to set the variables there as well:

**For WSL/Linux:**
```bash
export ANDROID_HOME=/mnt/c/Users/YourName/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

Add these lines to your `~/.bashrc` or `~/.zshrc` to make them permanent.

## After Setting Environment Variables

1. **Start your Android emulator** from Android Studio:
   - Open Android Studio
   - Go to **Tools** → **Device Manager**
   - Click the **Play** button next to your Pixel 5 emulator

2. **Verify emulator is running:**
   ```bash
   adb devices
   ```
   You should see your emulator listed.

3. **Run the app:**
   ```bash
   cd /home/user/Techsync/client
   npx expo run:android
   ```

## Alternative: Build Directly with Gradle

If environment variables are still problematic, you can build directly:

```bash
cd /home/user/Techsync/client/android
./gradlew assembleDebug
```

Then install manually:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### "SDK location not found"
- Make sure Android Studio SDK is fully installed
- Check that the SDK path exists on your system
- Verify environment variables are set correctly

### "adb: command not found"
- Ensure platform-tools are included in your PATH
- Try using the full path to adb: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools\adb.exe`

### Emulator not detected
- Start the emulator from Android Studio first
- Run `adb devices` to verify connection
- Try `adb kill-server` then `adb start-server`
