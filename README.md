# TechSync — Field Service Management Platform (In Development)

TechSync is a field service management platform designed to help property
management and service companies coordinate field technicians, work orders,
and documentation in one place.

This repo is intentionally **work-in-progress** to showcase:
- A **React Native** mobile client (plain RN CLI, not Expo)
- A **Python FastAPI** backend
- A **Supabase** Postgres database integration (via environment variables)



---

## Tech Stack

- **Frontend (client/)**
  - React Native (plain CLI)
  - React Navigation
  - Fetching data from a FastAPI backend
- **Backend (server/)**
  - FastAPI
  - Uvicorn
  - Supabase (Postgres) via `supabase-py`
- **Database**
  - Supabase (external project, configured via env vars)

---

## Project Structure

```text
client/   # React Native mobile app (techs & field ops)
server/   # FastAPI backend + Supabase integration
```

---

## Setup Instructions

### Backend Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Supabase (optional):**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and API key from https://supabase.com
   - If not configured, the API will use mock data

5. **Run the server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - Health check: `http://localhost:8000/health`
   - API docs: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Update API URL if needed:**
   - Edit `client/App.js` and change `API_BASE_URL` if your backend is not on `localhost:8000`
   - For Android emulator: use `http://10.0.2.2:8000`
   - For iOS simulator: use `http://localhost:8000`
   - For physical device: use your computer's IP address

4. **Run the app:**

   **For iOS:**
   ```bash
   npm run ios
   # or
   npx react-native run-ios
   ```

   **For Android:**
   ```bash
   npm run android
   # or
   npx react-native run-android
   ```

   Note: Make sure you have the React Native development environment set up. See [React Native Environment Setup](https://reactnative.dev/docs/environment-setup) for details.

---

## Database Schema

If using Supabase, create a `work_orders` table with the following schema:

```sql
CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## API Endpoints

- `GET /health` - Health check
- `GET /work-orders` - List all work orders
- `POST /work-orders` - Create a new work order

---

## Development Status

This is a work-in-progress MVP scaffold demonstrating:
- ✅ React Native mobile client with work order listing
- ✅ FastAPI backend with REST endpoints
- ✅ Supabase integration with fallback to mock data
- ✅ Basic error handling and loading states

See the roadmap below for planned features and next steps
