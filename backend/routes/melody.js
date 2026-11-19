const express = require('express');
const multer = require('multer');
const Search = require('../models/Search');
const { recognize, providerStatus } = require('../services/recognizers');
const { searchSpotify, searchMusicBrainz } = require('../services/catalogSearch');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

router.get('/providers', (_req, res) => res.json({ providers: [
  ...providerStatus(),
  { id: 'spotify', name: 'Spotify', configured: Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) },
  { id: 'musicbrainz', name: 'MusicBrainz', configured: true },
  { id: 'musixmatch', name: 'Musixmatch', configured: Boolean(process.env.MUSIXMATCH_API_KEY) },
] }));

router.post('/identify', (req, res, next) => upload.single('audio')(req, res, (error) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'CLIP_TOO_LARGE', message: 'Please record a shorter clip and try again.' });
  if (error) return next(error);
  next();
}), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'AUDIO_REQUIRED', message: 'Record a short audio clip before searching.' });
  if (!req.file.mimetype.startsWith('audio/')) return res.status(415).json({ error: 'UNSUPPORTED_AUDIO', message: 'This browser audio format is not supported.' });
  const configured = providerStatus().filter((provider) => provider.configured);
  if (!configured.length) return res.status(503).json({ error: 'NO_PROVIDERS_CONFIGURED', message: 'Add one or more recognition API keys in backend/.env to enable song matching.', providers: providerStatus() });
  try {
    const result = await recognize(req.file.buffer, req.file.originalname || 'hum.wav', req.file.mimetype);
    const suggestions = await Promise.all(result.suggestions.map(async (suggestion) => {
      const safeTitle = suggestion.title.replace(/["\\]/g, '\\$&');
      const safeArtist = suggestion.artist.replace(/["\\]/g, '\\$&');
      const catalogChecks = await Promise.allSettled([
        searchSpotify(`track:"${safeTitle}" artist:"${safeArtist}"`),
        searchMusicBrainz(`recording:"${safeTitle}" AND artist:"${safeArtist}"`),
      ]);
      const catalogResults = catalogChecks.flatMap((check) => check.status === 'fulfilled' ? check.value : []);
      const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const title = normalize(suggestion.title);
      const artist = normalize(suggestion.artist);
      const catalogMatches = catalogResults.filter((track) => {
        const candidateTitle = normalize(track.title);
        const candidateArtist = normalize(track.artist);
        const titleMatches = candidateTitle === title || candidateTitle.includes(title) || title.includes(candidateTitle);
        const artistMatches = candidateArtist === artist || candidateArtist.includes(artist) || artist.includes(candidateArtist);
        return titleMatches && artistMatches;
      });
      return {
        ...suggestion,
        catalogMatches: [...new Set(catalogMatches.map((match) => match.source))],
        links: { spotify: catalogMatches.find((match) => match.source === 'Spotify')?.url },
      };
    }));
    result.results.forEach((match) => Search.create({ type: 'melody', title: match.title, artist: match.artist, provider: match.providers.join(', ') }));
    res.json({ matches: result.results, suggestions, providers: result.providers });
  } catch (error) {
    console.error('Recognition failed:', error.message);
    res.status(502).json({ error: 'RECOGNITION_FAILED', message: 'Song recognition services could not be reached. Please try again.' });
  }
});

module.exports = router;
