# TechSync

A modern field service management platform for property management and service companies to coordinate technicians, work orders, and documentation.

## Overview

TechSync provides a complete solution for managing field service operations with a mobile-first approach. The platform features a React Native mobile application for technicians and a FastAPI backend with Supabase database integration.

## Tech Stack

**Frontend**
- React Native (CLI)
- React Navigation
- Modern component architecture

**Backend**
- FastAPI
- Uvicorn ASGI server
- Supabase (PostgreSQL)

## Project Structure

```
.
├── client/              # React Native mobile application
│   ├── src/
│   │   ├── screens/    # Application screens
│   │   └── config.js   # Configuration
│   ├── App.js          # Navigation setup
│   └── package.json
└── server/              # FastAPI backend
    ├── main.py         # API endpoints
    ├── supabase_client.py
    ├── schema.sql      # Database schema
    ├── requirements.txt
    └── .env.example
```

## Features

- **User Authentication**: Secure JWT-based authentication with login and registration
- **Work Order Management**: Create, view, edit, and delete work orders
- **Mobile Navigation**: Multi-screen mobile interface with auth flow
- **Status Tracking**: Track work order status (pending, in_progress, completed, cancelled)
- **Role-Based Access**: Support for admin and technician roles
- **Secure Storage**: JWT tokens stored securely in AsyncStorage
- **Offline Fallback**: Graceful degradation when database is unavailable
- **RESTful API**: Full CRUD operations via FastAPI

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.9+
- Supabase account
- Android Studio or Xcode (for mobile development)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials and JWT secret:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key-here
JWT_SECRET_KEY=your-secret-key-here-generate-with-openssl-rand-hex-32
```

Generate a secure JWT secret key:
```bash
openssl rand -hex 32
```

4. Set up the database:
- Go to your Supabase project SQL Editor
- Run the SQL in `schema.sql`

5. Start the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Mobile App Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Update API configuration (optional):
Edit `src/config.js` if your backend is not running on localhost:8000

4. Start Metro bundler:
```bash
npm start
```

5. Run on your platform:
```bash
# Android
npm run android

# iOS
npm run ios
```

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` for interactive API documentation.

### Endpoints

**Authentication**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT token | No |
| GET | `/auth/me` | Get current user info | Yes |

**Work Orders**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/work-orders` | List all work orders | Yes |
| POST | `/work-orders` | Create work order | Yes |
| PUT | `/work-orders/{id}` | Update work order | Yes |
| DELETE | `/work-orders/{id}` | Delete work order | Yes |

## Database Schema

```sql
users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)

work_orders (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to BIGINT REFERENCES users(id),
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

## Authentication

The app uses JWT (JSON Web Tokens) for secure authentication. Tokens are valid for 7 days.

### Demo Accounts

The database includes two demo accounts for testing:

- **Admin**: `admin@techsync.com` / `password123`
- **Technician**: `tech@techsync.com` / `password123`

### Mobile App Login

1. Launch the app
2. You'll see the login screen
3. Enter one of the demo accounts or register a new account
4. Token is automatically stored and persists across app restarts

## Development

The backend includes intelligent fallback to mock data when Supabase is not configured, allowing development without immediate database setup.

### Testing the API

```bash
# Register a new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techsync.com","password":"password123"}'

# Save the token from login response, then use it for authenticated requests
TOKEN="your-jwt-token-here"

# Get current user info
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# List work orders (requires authentication)
curl http://localhost:8000/work-orders \
  -H "Authorization: Bearer $TOKEN"

# Create work order (requires authentication)
curl -X POST http://localhost:8000/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Fix leak","description":"Kitchen sink","status":"pending"}'
```

## How to Run

This section provides detailed instructions for running TechSync locally or on a physical device.

### Quick Start (Local Development)

**1. Start the Backend**

```bash
# Navigate to server directory
cd server

# Install dependencies
pip install -r requirements.txt

# Set up environment (for development, Supabase is optional)
cp .env.example .env
# Edit .env and add your JWT secret:
# JWT_SECRET_KEY=$(openssl rand -hex 32)

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

**2. Start the Mobile App (iOS Simulator)**

```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# In another terminal, run on iOS
npm run ios
```

**3. Login to the App**

When the app launches, use one of the demo accounts:
- Email: `admin@techsync.com`
- Password: `password123`

### Running on Android Emulator

```bash
# Make sure Android Studio is installed and an emulator is running
cd client

# Update API URL for Android emulator
# Edit src/config.js and change to:
# export const API_BASE_URL = 'http://10.0.2.2:8000';

# Install and run
npm install
npm run android
```

### Running on Physical Device

**iOS Device:**

1. Update API configuration:
```bash
# Find your computer's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Edit client/src/config.js
# export const API_BASE_URL = 'http://192.168.1.100:8000';  # Use your IP
```

2. Ensure your device is on the same Wi-Fi network as your computer

3. Run the app:
```bash
cd client
npm run ios --device
```

**Android Device:**

1. Enable USB debugging on your Android device

2. Update API configuration:
```bash
# Find your computer's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Edit client/src/config.js
# export const API_BASE_URL = 'http://192.168.1.100:8000';  # Use your IP
```

3. Connect device via USB and run:
```bash
cd client
npm run android
```

4. Accept USB debugging prompt on device

### Running with Supabase (Full Setup)

1. Create a Supabase project at https://supabase.com

2. Run the database schema:
   - Go to Supabase SQL Editor
   - Copy and paste contents of `server/schema.sql`
   - Execute the SQL

3. Configure environment variables:
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
JWT_SECRET_KEY=your-generated-secret-key
```

4. Start the server and mobile app as described above

### Troubleshooting

**Backend won't start:**
- Check Python version: `python --version` (requires 3.9+)
- Reinstall dependencies: `pip install --upgrade -r requirements.txt`
- Check port 8000 is not in use: `lsof -i :8000`

**Mobile app can't connect to backend:**
- Verify backend is running: `curl http://localhost:8000/health`
- Check API_BASE_URL in `client/src/config.js` matches your setup
- For physical devices, ensure same Wi-Fi network
- For Android emulator, use `http://10.0.2.2:8000`
- Check firewall allows connections on port 8000

**"Session expired" errors:**
- JWT tokens expire after 7 days
- Simply logout and login again
- Check JWT_SECRET_KEY is set in server/.env

**Metro bundler issues:**
```bash
cd client
npm start -- --reset-cache
```

**iOS build issues:**
```bash
cd client/ios
pod install
cd ..
npm run ios
```

**Android build issues:**
```bash
cd client/android
./gradlew clean
cd ..
npm run android
```

**Database errors:**
- Verify Supabase credentials in .env
- Check schema.sql has been executed
- The app works without Supabase (uses mock data)

## License

MIT
