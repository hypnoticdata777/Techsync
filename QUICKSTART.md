# TechSync - Quick Start & Demo Script

## 5-Minute Demo Script

This script will get TechSync running and showcase its key features in under 5 minutes.

### Step 1: Start the Backend (1 minute)

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
pip install -r requirements.txt

# Generate JWT secret and create .env
echo "JWT_SECRET_KEY=$(openssl rand -hex 32)" > .env

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:** Open http://localhost:8000/docs - you should see the API documentation

### Step 2: Start the Mobile App (2 minutes)

```bash
# In a new terminal, navigate to client
cd client

# Install dependencies (first time only)
npm install

# For iOS (macOS only - first time)
cd ios && pod install && cd ..

# Start Metro bundler
npm start
```

**In a third terminal:**

```bash
# For iOS Simulator
cd client && npm run ios

# OR for Android Emulator (update config first - see below)
cd client && npm run android
```

**Android Note:** Before running on Android emulator, edit `client/src/config.js`:
```javascript
export const API_BASE_URL = 'http://10.0.2.2:8000';
```

### Step 3: Demo the Features (2 minutes)

**Login Flow:**
1. App launches to login screen
2. Login with demo account:
   - Email: `admin@techsync.com`
   - Password: `password123`
3. Successfully authenticates and navigates to home screen

**Work Order Management:**
1. View existing work orders with status badges
2. Tap "Create New Work Order" button
3. Fill in:
   - Title: "Emergency HVAC Repair"
   - Description: "AC unit not cooling, priority repair needed"
4. Submit - see new work order in list
5. Tap a work order to view details
6. Edit and change status (pending → in_progress → completed)
7. Navigate back to see updated status

**Authentication Persistence:**
1. Close the app completely
2. Reopen - automatically logged in (JWT stored in AsyncStorage)
3. Tap "Logout" to return to login screen

**API Testing (Optional):**
```bash
# Test API health
curl http://localhost:8000/health

# Login via API
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techsync.com","password":"password123"}'

# Use token from response to fetch work orders
curl http://localhost:8000/work-orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## One-Line Quick Start

**Fastest way to get running (requires two terminals):**

Terminal 1 (Backend):
```bash
cd server && pip install -r requirements.txt && echo "JWT_SECRET_KEY=$(openssl rand -hex 32)" > .env && uvicorn main:app --reload
```

Terminal 2 (Frontend):
```bash
cd client && npm install && npm start
```

Terminal 3 (Run App):
```bash
cd client && npm run ios  # or npm run android
```

---

## Demo Account Credentials

**Admin Account:**
- Email: `admin@techsync.com`
- Password: `password123`
- Role: Administrator
- Can: Create, view, edit, delete all work orders

**Technician Account:**
- Email: `tech@techsync.com`
- Password: `password123`
- Role: Technician
- Can: View and update assigned work orders

---

## Key Features to Showcase

1. **Mobile-First Design**
   - Native iOS/Android experience
   - Smooth navigation with React Navigation
   - Professional UI with proper spacing and styling

2. **Secure Authentication**
   - JWT-based auth with 7-day token expiration
   - Bcrypt password hashing
   - Token persistence across app restarts

3. **Real-Time CRUD Operations**
   - Create work orders instantly
   - Edit in real-time
   - Delete with immediate feedback
   - Status workflow (pending → in_progress → completed)

4. **Offline Resilience**
   - Backend falls back to mock data when Supabase unavailable
   - App handles network errors gracefully
   - Clear error messages to users

5. **Developer Experience**
   - FastAPI auto-generated docs at /docs
   - Hot reload for both backend (uvicorn) and frontend (Metro)
   - Clear project structure
   - Environment-based configuration

---

## Troubleshooting Quick Fixes

**Port 8000 already in use:**
```bash
lsof -i :8000  # Find process
kill -9 PID    # Kill it
```

**Metro bundler cache issues:**
```bash
cd client && npm start -- --reset-cache
```

**Can't connect from mobile app:**
- iOS Simulator: Use `http://localhost:8000`
- Android Emulator: Use `http://10.0.2.2:8000`
- Physical Device: Use `http://YOUR_COMPUTER_IP:8000`

**"Session expired" message:**
- Just logout and login again (tokens expire after 7 days)

---

## What's Running Where

| Component | URL/Location | Purpose |
|-----------|--------------|---------|
| FastAPI Server | http://localhost:8000 | Backend API |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Metro Bundler | http://localhost:8081 | React Native bundler |
| Mobile App | iOS Simulator / Android Emulator | Field service mobile interface |

---

## Next: See Full Documentation

- **VS Code Setup:** See `VSCODE_SETUP_GUIDE.md` for complete IDE integration
- **Technical Details:** See `APPENDIX_TECHNICAL_OVERVIEW.md` for architecture, tech stack, and production roadmap
- **Full README:** See `README.md` for comprehensive documentation
