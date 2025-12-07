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
