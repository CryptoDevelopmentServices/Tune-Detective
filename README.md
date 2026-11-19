# Tune Detective

Tune Detective helps users find a song from a short microphone recording or a text search. The React PWA can be installed from the browser on iOS and Android. A Node/Express API fans each audio clip out to every configured recognition provider and stores lookup metadata in a local SQLite database.

## Start both apps

From the repository root:

```sh
npm install
npm run dev
```

That starts the API at `http://localhost:5000` and the web app at `http://localhost:3000` together. Vite proxies `/api` to the backend. Microphone permission works on localhost and HTTPS deployments.

Copy `backend/.env.example` to `backend/.env` and add any provider credentials you have. Each provider is optional; the app reports which ones are configured and searches the ones that are ready. SQLite creates `backend/data/tune-detective.sqlite` automatically. You do not need to install or start a separate database server.

## Song search sources

Audio recognition runs concurrently against:

- **AI-assisted** — Gemini analyzes the recorded clip and can suggest a hummed song; ACRCloud can return its dedicated humming-recognition results when humming is enabled on the ACRCloud project.
- **AudD** — send a short audio clip directly to the recognition API.
- **ACRCloud audio recognition** — signed audio identification requests.
- **AcoustID** — Chromaprint fingerprints generated with `fpcalc`, then looked up against AcoustID recordings.

Text search queries **Spotify**, **Musixmatch** (when configured), and **MusicBrainz**. Spotify adds catalog matches and links; it does not recognize the microphone audio by itself. AI song suggestions are checked against Spotify and MusicBrainz, but a catalog hit only shows that the track exists; it does not prove that the audio matched. Results from active sources are combined and duplicates removed. AI suggestions stay separate from audio matches and are labeled as unverified. Traditional fingerprint services are designed primarily for recorded music; hummed and sung melodies may not match as reliably. AI suggestions can be wrong.

## Configure providers

See `backend/.env.example`:

- `GEMINI_API_KEY` and optional `GEMINI_MODEL` (defaults to `gemini-4-hydrogen`)
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and optional `SPOTIFY_MARKET`
- `AUDD_API_TOKEN`
- `ACRCLOUD_HOST`, `ACRCLOUD_ACCESS_KEY`, `ACRCLOUD_ACCESS_SECRET`
- `ACOUSTID_API_KEY` and `FPCALC_PATH` (the `fpcalc` executable must be installed)
- `MUSIXMATCH_API_KEY`

AcoustID uses Chromaprint fingerprints and requires an application client key. Gemini receives the recorded clip for audio analysis when its key is configured, so include that in your privacy notice and check current API terms and pricing. AI suggestions can be wrong. ACRCloud and AudD have their own account credentials and usage limits; check their plans before deploying at scale.

## Docker

Copy `backend/.env.example` to `backend/.env`, add credentials, then run:

```sh
docker compose up --build
```

The frontend is available at `http://localhost:3000`; SQLite data is kept in a named volume.

## iOS and Android

For local installs, deploy the PWA over HTTPS and use the browser's **Add to Home Screen** / **Install app** action. App Store and Google Play packages require a separate native wrapper and store release process.
