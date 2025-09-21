# 🎶 Tune Detective

Identify songs by audio or lyrics.

## 🚀 Run without Docker
1. Start MongoDB locally
2. Setup backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm start
   ```
3. Setup frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 🐳 Run with Docker
```bash
docker-compose up
```
Then open frontend on [http://localhost:3000](http://localhost:3000)
