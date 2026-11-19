const express = require('express');
const axios = require('axios');
const Search = require('../models/Search');
const { searchSpotify, searchMusicBrainz } = require('../services/catalogSearch');
const router = express.Router();

async function searchMusixmatch(query) {
  if (!process.env.MUSIXMATCH_API_KEY) return [];
  const { data } = await axios.get('https://api.musixmatch.com/ws/1.1/track.search', {
    params: { apikey: process.env.MUSIXMATCH_API_KEY, q: query, page_size: 8, s_track_rating: 'desc', format: 'json' },
    timeout: 8000,
  });
  return (data.message?.body?.track_list || []).map(({ track }) => ({
    title: track.track_name,
    artist: track.artist_name,
    album: track.album_name,
    source: 'Musixmatch',
    trackId: track.track_id,
  }));
}

router.get('/:query', async (req, res) => {
  const query = String(req.params.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Enter a song, artist, or lyric to search.' });
  const sourceChecks = [
    { name: 'Musixmatch', configured: Boolean(process.env.MUSIXMATCH_API_KEY), search: searchMusixmatch },
    { name: 'MusicBrainz', configured: true, search: searchMusicBrainz },
    { name: 'Spotify', configured: Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET), search: searchSpotify },
  ];
  const outcomes = await Promise.allSettled(sourceChecks.map((source) => source.search(query)));
  const tracks = outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? outcome.value : []);
  const unique = new Map();
  for (const track of tracks) {
    const key = `${track.title}|${track.artist}`.toLowerCase();
    if (!unique.has(key)) unique.set(key, { ...track, sources: [track.source] });
    else {
      const existing = unique.get(key);
      existing.sources = [...new Set([...(existing.sources || [existing.source]), track.source])];
      existing.url ||= track.url;
      existing.artwork ||= track.artwork;
    }
  }
  if (!tracks.length) return res.status(502).json({ error: 'Song search services are temporarily unavailable. Try again shortly.' });
  Search.create({ query, type: 'words' });
  res.json({
    tracks: [...unique.values()].slice(0, 12),
    sources: sourceChecks.map((source, index) => ({ name: source.name, status: !source.configured ? 'not-configured' : outcomes[index].status === 'fulfilled' ? 'ready' : 'unavailable' })),
  });
});

module.exports = router;
