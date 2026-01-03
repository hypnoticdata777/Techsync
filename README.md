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

- **Work Order Management**: Create, view, edit, and delete work orders
- **Mobile Navigation**: Multi-screen mobile interface
- **Status Tracking**: Track work order status (pending, in_progress, completed, cancelled)
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

Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key-here
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/work-orders` | List all work orders |
| POST | `/work-orders` | Create work order |
| PUT | `/work-orders/{id}` | Update work order |
| DELETE | `/work-orders/{id}` | Delete work order |

## Database Schema

```sql
work_orders (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

## Development

The backend includes intelligent fallback to mock data when Supabase is not configured, allowing development without immediate database setup.

### Testing the API

```bash
# Health check
curl http://localhost:8000/health

# List work orders
curl http://localhost:8000/work-orders

# Create work order
curl -X POST http://localhost:8000/work-orders \
  -H "Content-Type: application/json" \
  -d '{"title":"Fix leak","description":"Kitchen sink","status":"pending"}'
```

## License

MIT
