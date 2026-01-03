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

## License

MIT
