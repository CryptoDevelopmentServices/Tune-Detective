# Tune Detective

🎵 Song recognition app with offline + online support, built with React (PWA) + Express + MongoDB.

## Features
- Online & offline support (PWA + caching)
- AcoustID + Musixmatch + Spotify fallback
- MongoDB caching of past searches
- Works with or without Docker

## Setup
1. Copy `.env.example` to `.env` in backend and fill in your API keys
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Run locally without Docker:
   ```bash
   cd backend && npm start
   cd frontend && npm run dev
   ```
4. With Docker:
   ```bash
   docker-compose up --build
   ```

