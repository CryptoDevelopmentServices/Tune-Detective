const axios = require('axios');

let spotifyToken;
let spotifyTokenExpiresAt = 0;

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (spotifyToken && Date.now() < spotifyTokenExpiresAt) return spotifyToken;
  const { data } = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({ grant_type: 'client_credentials' }), {
    auth: { username: clientId, password: clientSecret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 8000,
  });
  spotifyToken = data.access_token;
  spotifyTokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 60) * 1000;
  return spotifyToken;
}

async function searchSpotify(query) {
  const token = await getSpotifyToken();
  if (!token) return [];
  const { data } = await axios.get('https://api.spotify.com/v1/search', {
    params: { q: query, type: 'track', market: process.env.SPOTIFY_MARKET || 'GB', limit: 8 },
    headers: { Authorization: `Bearer ${token}` },
    timeout: 8000,
  });
  return (data.tracks?.items || []).map((track) => ({
    title: track.name,
    artist: track.artists?.map((artist) => artist.name).join(', '),
    album: track.album?.name,
    source: 'Spotify',
    trackId: track.id,
    url: track.external_urls?.spotify,
    artwork: track.album?.images?.[0]?.url,
  }));
}

async function searchMusicBrainz(query) {
  const { data } = await axios.get('https://musicbrainz.org/ws/2/recording/', {
    params: { query, fmt: 'json', limit: 8 },
    headers: { 'User-Agent': 'TuneDetective/1.0 (song discovery app)' },
    timeout: 8000,
  });
  return (data.recordings || []).map((recording) => ({
    title: recording.title,
    artist: (recording['artist-credit'] || []).map((credit) => `${credit.name || credit.artist?.name || ''}${credit.joinphrase || ''}`).join(''),
    album: recording.releases?.[0]?.title,
    source: 'MusicBrainz',
    trackId: recording.id,
    url: `https://musicbrainz.org/recording/${recording.id}`,
  }));
}

module.exports = { searchSpotify, searchMusicBrainz };
