# 🎵 Tune Detective (Full Dockerized)

A Shazam-like app using **AcoustID + Chromaprint + MongoDB + React Native (Expo)**.  
Supports humming/singing, web preview, and building for Android/iOS.

## 🚀 Run with Docker

```bash
# Build & start all services
docker-compose up --build
```

### Services
- **MongoDB** → mongodb://localhost:27017/tune-detective
- **Backend** → http://localhost:5000
- **Frontend (Expo Web)** → http://localhost:19006

### Mobile Builds
Inside the frontend container:
```bash
# Android build
expo run:android

# iOS build (only on macOS hosts)
expo run:ios
```

## 🔹 Features
- Identify music by microphone (play, hum, sing)
- Stores results in MongoDB for fallback
- Shazam-style UI in purple + orange
- Training mode: manually add songs to database
- Full Docker setup (MongoDB + Backend + Frontend with Expo)
