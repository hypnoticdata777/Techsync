# TechSync - VS Code Setup & Development Guide

Complete guide for developing TechSync using Visual Studio Code with optimal configuration, extensions, and workflows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Recommended Extensions](#recommended-extensions)
4. [Workspace Configuration](#workspace-configuration)
5. [Running the Application](#running-the-application)
6. [Debugging](#debugging)
7. [Development Workflow](#development-workflow)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Visual Studio Code**
   - Download from: https://code.visualstudio.com/
   - Version: 1.80+ recommended

2. **Node.js**
   - Version: 16.x or higher
   - Download from: https://nodejs.org/
   - Verify: `node --version`

3. **Python**
   - Version: 3.9 or higher
   - Download from: https://www.python.org/
   - Verify: `python3 --version`

4. **React Native Development Environment**

   **For iOS (macOS only):**
   - Xcode 14+ from App Store
   - Xcode Command Line Tools: `xcode-select --install`
   - CocoaPods: `sudo gem install cocoapods`

   **For Android:**
   - Android Studio
   - Android SDK (API 31+)
   - Add to PATH:
     ```bash
     # Add to ~/.zshrc or ~/.bash_profile
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

5. **Git**
   - Verify: `git --version`

---

## Initial Setup

### 1. Clone and Open Project

```bash
# Clone the repository
git clone <repository-url>
cd Techsync

# Open in VS Code
code .
```

### 2. Install Dependencies

**Open VS Code Terminal** (`` Ctrl+` `` or `View → Terminal`)

```bash
# Install backend dependencies
cd server
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd client
npm install
cd ..
```

**For iOS:**
```bash
cd client/ios
pod install
cd ../..
```

### 3. Configure Environment

**Backend Configuration:**

```bash
# Create .env file in server directory
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
# Required: Generate with `openssl rand -hex 32`
JWT_SECRET_KEY=your-generated-secret-key-here

# Optional: For production database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

**Frontend Configuration:**

Edit `client/src/config.js` based on your setup:
```javascript
// For iOS Simulator
export const API_BASE_URL = 'http://localhost:8000';

// For Android Emulator
// export const API_BASE_URL = 'http://10.0.2.2:8000';

// For Physical Device (replace with your computer's IP)
// export const API_BASE_URL = 'http://192.168.1.100:8000';
```

---

## Recommended Extensions

### Essential Extensions

Install these extensions from VS Code Marketplace (Ctrl+Shift+X):

**Python Development:**
- **Python** (ms-python.python)
  - Linting, debugging, IntelliSense
- **Pylance** (ms-python.vscode-pylance)
  - Fast, feature-rich language support

**JavaScript/React Native:**
- **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)
  - Code snippets for React Native
- **React Native Tools** (msjsdiag.vscode-react-native)
  - Debugging and IntelliSense for React Native
- **ESLint** (dbaeumer.vscode-eslint)
  - JavaScript linting

**General Development:**
- **GitLens** (eamodio.gitlens)
  - Enhanced Git capabilities
- **Thunder Client** (rangav.vscode-thunder-client)
  - REST API testing (alternative to Postman)
- **Error Lens** (usernamehw.errorlens)
  - Inline error highlighting
- **Path Intellisense** (christian-kohler.path-intellisense)
  - Autocomplete for file paths
- **Auto Rename Tag** (formulahendry.auto-rename-tag)
  - Automatically rename paired tags
- **Better Comments** (aaron-bond.better-comments)
  - Improve comment readability

### Optional but Helpful

- **Material Icon Theme** (pkief.material-icon-theme)
  - Better file icons
- **Bracket Pair Colorizer 2** (coenraads.bracket-pair-colorizer-2)
  - Color-coded brackets
- **indent-rainbow** (oderwat.indent-rainbow)
  - Colorize indentation

---

## Workspace Configuration

### Create VS Code Workspace Settings

Create `.vscode/settings.json` in project root:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/server/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "python.analysis.extraPaths": ["${workspaceFolder}/server"],

  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },

  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/.pytest_cache": true,
    "**/node_modules": true,
    "**/.git": false
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true,
    "**/__pycache__": true,
    "**/ios/build": true,
    "**/android/build": true,
    "**/android/.gradle": true
  },

  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/venv/**": true,
    "**/ios/build/**": true,
    "**/android/build/**": true
  },

  "[python]": {
    "editor.tabSize": 4,
    "editor.insertSpaces": true
  },

  "[javascript]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },

  "[javascriptreact]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  }
}
```

### Create Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "cwd": "${workspaceFolder}/server",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/server"
      },
      "console": "integratedTerminal",
      "justMyCode": true
    },
    {
      "name": "Attach to React Native",
      "type": "reactnative",
      "request": "attach",
      "cwd": "${workspaceFolder}/client"
    }
  ]
}
```

### Create Tasks Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "uvicorn main:app --reload --host 0.0.0.0 --port 8000",
      "options": {
        "cwd": "${workspaceFolder}/server"
      },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Start Metro Bundler",
      "type": "shell",
      "command": "npm start",
      "options": {
        "cwd": "${workspaceFolder}/client"
      },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Run iOS",
      "type": "shell",
      "command": "npm run ios",
      "options": {
        "cwd": "${workspaceFolder}/client"
      },
      "dependsOn": ["Start Metro Bundler"]
    },
    {
      "label": "Run Android",
      "type": "shell",
      "command": "npm run android",
      "options": {
        "cwd": "${workspaceFolder}/client"
      },
      "dependsOn": ["Start Metro Bundler"]
    },
    {
      "label": "Install Python Dependencies",
      "type": "shell",
      "command": "pip install -r requirements.txt",
      "options": {
        "cwd": "${workspaceFolder}/server"
      }
    },
    {
      "label": "Install Node Dependencies",
      "type": "shell",
      "command": "npm install",
      "options": {
        "cwd": "${workspaceFolder}/client"
      }
    }
  ]
}
```

---

## Running the Application

### Method 1: Using VS Code Tasks (Recommended)

1. **Start Backend:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type: `Tasks: Run Task`
   - Select: `Start Backend`
   - Backend will start in integrated terminal

2. **Start Mobile App:**
   - Press `Ctrl+Shift+P`
   - Type: `Tasks: Run Task`
   - Select: `Run iOS` or `Run Android`

### Method 2: Using Integrated Terminal

1. **Split Terminal into 3 panes:**
   - Open terminal: `` Ctrl+` ``
   - Click the split terminal icon (+) twice

2. **Pane 1 - Backend:**
   ```bash
   cd server
   uvicorn main:app --reload
   ```

3. **Pane 2 - Metro Bundler:**
   ```bash
   cd client
   npm start
   ```

4. **Pane 3 - Run App:**
   ```bash
   cd client
   npm run ios
   # or
   npm run android
   ```

### Method 3: Using Debug Configuration

1. Press `F5` or go to Run & Debug sidebar (Ctrl+Shift+D)
2. Select "Python: FastAPI" from dropdown
3. Click green play button
4. Backend starts with debugger attached

For mobile app, use terminal method since React Native debugging requires Metro bundler.

---

## Debugging

### Backend Debugging (FastAPI)

1. **Set Breakpoints:**
   - Click in the gutter left of line numbers in Python files
   - Red dot appears

2. **Start Debug Session:**
   - Press `F5`
   - Select "Python: FastAPI"
   - Make API request (via mobile app or Thunder Client)
   - Execution pauses at breakpoint

3. **Debug Controls:**
   - `F5`: Continue
   - `F10`: Step Over
   - `F11`: Step Into
   - `Shift+F11`: Step Out
   - `Ctrl+Shift+F5`: Restart
   - `Shift+F5`: Stop

4. **Inspect Variables:**
   - Hover over variables to see values
   - Use Debug Console to evaluate expressions
   - Variables panel shows all locals

### Frontend Debugging (React Native)

1. **Enable Chrome DevTools:**
   - In simulator, press `Cmd+D` (iOS) or `Cmd+M` (Android)
   - Select "Debug"
   - Opens Chrome debugger

2. **React Native Debugger (Better Option):**
   ```bash
   # Install standalone debugger
   brew install --cask react-native-debugger

   # Open before running app
   open "rndebugger://set-debugger-loc?host=localhost&port=8081"
   ```

3. **Log Debugging:**
   - Use `console.log()` in code
   - View in Metro Bundler terminal
   - Or in React Native Debugger console

---

## Development Workflow

### Recommended Workspace Layout

```
┌─────────────────────────────────────────────┐
│ Explorer    │ Editor (Code)                 │
│ (Sidebar)   │                               │
│             │                               │
│             │                               │
├─────────────┴───────────────────────────────┤
│ Terminal (Split into 3 panes)              │
│ [Backend] [Metro] [Commands]               │
└─────────────────────────────────────────────┘
```

### Daily Development Flow

1. **Morning Setup (5 min):**
   ```bash
   # Pull latest changes
   git pull

   # Start backend (Terminal 1)
   cd server && uvicorn main:app --reload

   # Start Metro (Terminal 2)
   cd client && npm start

   # Run app (Terminal 3)
   cd client && npm run ios
   ```

2. **Development Cycle:**
   - Edit code in VS Code
   - Save file (Ctrl+S) - auto-formats
   - Backend auto-reloads (uvicorn --reload)
   - Frontend hot-reloads (Metro bundler)
   - Test in simulator
   - Commit changes

3. **End of Day:**
   ```bash
   # Commit work
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Code Navigation Tips

- **Go to Definition:** `F12` or `Cmd+Click`
- **Find All References:** `Shift+F12`
- **Quick Open File:** `Ctrl+P`, type filename
- **Command Palette:** `Ctrl+Shift+P`
- **Go to Symbol:** `Ctrl+Shift+O` (see all functions in file)
- **Go to Symbol in Workspace:** `Ctrl+T`
- **Multi-cursor:** `Alt+Click` or `Ctrl+Alt+Down/Up`

---

## Common Tasks

### Test API Endpoints (Thunder Client)

1. Install Thunder Client extension
2. Open Thunder Client sidebar
3. **Create Login Request:**
   - Method: POST
   - URL: `http://localhost:8000/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@techsync.com",
       "password": "password123"
     }
     ```
   - Send → Copy token from response

4. **Create Authenticated Request:**
   - Method: GET
   - URL: `http://localhost:8000/work-orders`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer YOUR_TOKEN_HERE`
   - Send → See work orders

### View API Documentation

1. Start backend
2. In VS Code, press `Ctrl+Shift+P`
3. Type: `Simple Browser: Show`
4. Enter URL: `http://localhost:8000/docs`
5. Interactive API docs open in VS Code

### Add New API Endpoint

1. Open `server/main.py`
2. Add new route:
   ```python
   @app.get("/my-endpoint")
   async def my_endpoint():
       return {"message": "Hello"}
   ```
3. Save - uvicorn auto-reloads
4. Test at `http://localhost:8000/my-endpoint`
5. Check docs at `http://localhost:8000/docs`

### Add New React Native Screen

1. Create file: `client/src/screens/NewScreen.js`
2. Add screen component:
   ```javascript
   import React from 'react';
   import { View, Text } from 'react-native';

   const NewScreen = () => {
     return (
       <View>
         <Text>New Screen</Text>
       </View>
     );
   };

   export default NewScreen;
   ```
3. Register in `client/App.js`:
   ```javascript
   import NewScreen from './src/screens/NewScreen';

   <Stack.Screen name="New" component={NewScreen} />
   ```
4. Navigate to it:
   ```javascript
   navigation.navigate('New');
   ```
5. Save - Metro hot-reloads

### Database Changes (Supabase)

1. Edit `server/schema.sql`
2. Go to Supabase SQL Editor
3. Copy updated SQL
4. Execute
5. Update `server/main.py` models if needed
6. Restart backend

### View Logs

**Backend Logs:**
- Appear in terminal running uvicorn
- Color-coded by log level
- Shows request/response info

**Frontend Logs:**
- Metro bundler terminal shows all `console.log()`
- Warnings and errors highlighted
- Stack traces for crashes

**Database Logs:**
- Supabase Dashboard → Logs
- Or use logger in `server/logger.py`

---

## Troubleshooting

### Backend Issues

**Import errors:**
```bash
# Ensure in server directory
cd server
pip install -r requirements.txt

# Check Python path
which python3
```

**Port 8000 already in use:**
```bash
# Find process
lsof -i :8000

# Kill it
kill -9 <PID>
```

**Environment variables not loading:**
- Check `.env` file exists in `server/` directory
- Check file has no syntax errors
- Restart uvicorn

### Frontend Issues

**Metro bundler won't start:**
```bash
cd client
npm start -- --reset-cache
```

**iOS build fails:**
```bash
cd client/ios
pod install
cd ..
npm run ios
```

**Android build fails:**
```bash
cd client/android
./gradlew clean
cd ..
npm run android
```

**Can't connect to backend:**
- Check backend is running: `curl http://localhost:8000/health`
- Check `client/src/config.js` has correct URL
- For Android emulator, use `http://10.0.2.2:8000`
- For physical device, use computer's IP address

### VS Code Issues

**Extensions not working:**
- Reload window: `Ctrl+Shift+P` → "Reload Window"
- Check extension is enabled
- Check extension requirements met

**Debugger won't attach:**
- Ensure no other debugger running
- Check launch.json configuration
- Restart VS Code

**Terminal not working:**
- Check default shell: `Ctrl+Shift+P` → "Terminal: Select Default Profile"
- Clear terminal: `Ctrl+K`
- Create new terminal: `` Ctrl+Shift+` ``

**IntelliSense not working:**
- Python: Check interpreter selected (bottom left)
- JavaScript: Check `node_modules` installed
- Reload window

---

## Pro Tips

### Productivity Shortcuts

- **Format Document:** `Shift+Alt+F`
- **Toggle Sidebar:** `Ctrl+B`
- **Toggle Terminal:** `` Ctrl+` ``
- **Split Editor:** `Ctrl+\`
- **Close Editor:** `Ctrl+W`
- **Quick Fix:** `Ctrl+.` (on error)
- **Rename Symbol:** `F2`
- **Comment Line:** `Ctrl+/`

### Multi-Root Workspace

Create `techsync.code-workspace`:
```json
{
  "folders": [
    { "path": "server", "name": "Backend (Python)" },
    { "path": "client", "name": "Frontend (React Native)" }
  ],
  "settings": {
    "files.exclude": {
      "**/__pycache__": true,
      "**/node_modules": true
    }
  }
}
```

Open with: `code techsync.code-workspace`

### Code Snippets

Create custom snippets: `Ctrl+Shift+P` → "Preferences: Configure User Snippets"

**Python snippet for new endpoint:**
```json
{
  "FastAPI Endpoint": {
    "prefix": "endpoint",
    "body": [
      "@app.${1:get}(\"/${2:path}\")",
      "async def ${3:function_name}():",
      "    return {\"message\": \"${4:Hello}\"}"
    ]
  }
}
```

---

## Additional Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Native Docs:** https://reactnative.dev/
- **VS Code Docs:** https://code.visualstudio.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

## Next Steps

- See `QUICKSTART.md` for quick demo script
- See `APPENDIX_TECHNICAL_OVERVIEW.md` for architecture details
- See `README.md` for comprehensive project documentation
