const axios = require('axios');
const FormData = require('form-data');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

function normalized(title, artist, provider, score = null, links = {}) {
  if (!title || !artist) return null;
  return { title, artist, provider, score, links };
}

async function audd(buffer, filename, mimeType) {
  if (!process.env.AUDD_API_TOKEN) return null;
  const form = new FormData();
  form.append('api_token', process.env.AUDD_API_TOKEN);
  form.append('return', 'spotify,apple_music,deezer,musicbrainz');
  form.append('file', buffer, { filename, contentType: mimeType });
  const { data } = await axios.post('https://api.audd.io/', form, { headers: form.getHeaders(), timeout: 12000, maxBodyLength: 10 * 1024 * 1024 });
  const song = data.result;
  return song ? normalized(song.title, song.artist, 'AudD', null, { spotify: song.spotify?.external_urls?.spotify, appleMusic: song.apple_music?.url, deezer: song.deezer?.link, musicbrainz: song.musicbrainz?.track?.id }) : null;
}

async function acrcloud(buffer, filename, mimeType) {
  const { ACRCLOUD_HOST, ACRCLOUD_ACCESS_KEY: accessKey, ACRCLOUD_ACCESS_SECRET: secret } = process.env;
  if (!ACRCLOUD_HOST || !accessKey || !secret) return null;
  const host = ACRCLOUD_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const toSign = `POST\n/v1/identify\n${accessKey}\naudio\n1\n${timestamp}`;
  const signature = crypto.createHmac('sha1', secret).update(toSign).digest('base64');
  const form = new FormData();
  form.append('access_key', accessKey);
  form.append('sample_bytes', String(buffer.length));
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('data_type', 'audio');
  form.append('signature_version', '1');
  form.append('sample', buffer, { filename, contentType: mimeType });
  const { data } = await axios.post(`https://${host}/v1/identify`, form, { headers: form.getHeaders(), timeout: 12000, maxBodyLength: 10 * 1024 * 1024 });
  const hummingMatch = data.metadata?.humming?.[0];
  const song = hummingMatch || data.metadata?.music?.[0];
  const spotifyId = song?.external_metadata?.spotify?.track?.id;
  const provider = hummingMatch ? 'ACRCloud AI Humming' : 'ACRCloud';
  return data.status?.code === 0 && song ? normalized(song.title, song.artists?.map((a) => a.name).join(', '), provider, song.score == null ? null : Number(song.score), { acrid: song.acrid, album: song.album?.name, spotify: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : undefined }) : null;
}

function fingerprintAudio(filePath) {
  const binary = process.env.FPCALC_PATH || 'fpcalc';
  return new Promise((resolve, reject) => {
    const child = spawn(binary, ['-json', filePath], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr || 'fpcalc failed'));
      try { resolve(JSON.parse(stdout)); } catch (error) { reject(error); }
    });
  });
}

async function acoustid(buffer, filename) {
  if (!process.env.ACOUSTID_API_KEY) return null;
  const temporaryFile = path.join(os.tmpdir(), `tune-${crypto.randomUUID()}-${path.basename(filename)}`);
  try {
    await fs.writeFile(temporaryFile, buffer, { flag: 'wx' });
    const fingerprint = await fingerprintAudio(temporaryFile);
    const { data } = await axios.post('https://api.acoustid.org/v2/lookup', new URLSearchParams({
      client: process.env.ACOUSTID_API_KEY,
      duration: String(Math.round(fingerprint.duration)),
      fingerprint: fingerprint.fingerprint,
      meta: 'recordings',
      format: 'json',
    }), { timeout: 12000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const results = data.results || [];
    const best = results.sort((a, b) => b.score - a.score).find((result) => result.recordings?.length);
    const recording = best?.recordings?.[0];
    const artist = recording?.artists?.map((item) => item.name).join(', ');
    return normalized(recording?.title, artist, 'AcoustID', best?.score ?? null, { musicbrainz: recording?.id });
  } finally {
    await fs.unlink(temporaryFile).catch(() => {});
  }
}

async function gemini(buffer) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
  const { data } = await axios.post('https://generativelanguage.googleapis.com/v1beta/interactions', {
    model,
    input: [
      { type: 'text', text: 'Listen to this short recording, which may be a person humming or singing a remembered melody. Identify the original song only if you recognize it. Never make up a title or artist. If you are unsure, return songFound=false and empty title and artist. Return JSON only.' },
      { type: 'audio', data: buffer.toString('base64'), mime_type: 'audio/wav' },
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: {
        type: 'object',
        properties: {
          songFound: { type: 'boolean' },
          title: { type: 'string' },
          artist: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['songFound', 'title', 'artist', 'confidence'],
      },
    },
  }, { headers: { 'x-goog-api-key': apiKey, 'Api-Revision': '2026-05-20' }, timeout: 20000, maxBodyLength: 10 * 1024 * 1024 });
  const output = data.output_text || (data.output || []).flatMap((step) => step.content || []).filter((item) => item.type === 'text').map((item) => item.text).join('');
  if (!output) return null;
  const candidate = JSON.parse(output);
  if (!candidate.songFound || !candidate.title || !candidate.artist) return null;
  return { ...normalized(candidate.title, candidate.artist, 'Gemini AI', Number(candidate.confidence) || null), aiSuggestion: true };
}

const providers = [
  { id: 'audd', name: 'AudD', configured: () => Boolean(process.env.AUDD_API_TOKEN) },
  { id: 'acrcloud', name: 'ACRCloud', configured: () => Boolean(process.env.ACRCLOUD_HOST && process.env.ACRCLOUD_ACCESS_KEY && process.env.ACRCLOUD_ACCESS_SECRET) },
  { id: 'acoustid', name: 'AcoustID', configured: () => Boolean(process.env.ACOUSTID_API_KEY) },
  { id: 'gemini', name: 'Gemini AI', configured: () => Boolean(process.env.GEMINI_API_KEY) },
];

async function recognize(buffer, filename, mimeType) {
  const configured = providers.filter((provider) => provider.configured());
  const implementations = { audd, acrcloud, acoustid, gemini };
  const outcomes = await Promise.allSettled(configured.map((provider) => implementations[provider.id](buffer, filename, mimeType)));
  const matches = new Map();
  const suggestions = [];
  outcomes.forEach((outcome, index) => {
    if (outcome.status !== 'fulfilled' || !outcome.value) return;
    const match = outcome.value;
    if (match.aiSuggestion) { suggestions.push(match); return; }
    const key = `${match.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${match.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const existing = matches.get(key) || { ...match, providers: [], confidence: 0 };
    existing.providers.push(match.provider);
    existing.confidence += match.score ?? 0.7;
    existing.links = { ...existing.links, ...match.links };
    matches.set(key, existing);
  });
  const matchProviderCount = Math.max(configured.filter((provider) => provider.id !== 'gemini').length, 1);
  const results = [...matches.values()].map((match) => ({ ...match, confidence: Math.min(match.confidence / matchProviderCount, 1) })).sort((a, b) => b.confidence - a.confidence);
  return { results, suggestions, providers: configured.map((provider, index) => ({ name: provider.name, status: outcomes[index].status === 'fulfilled' ? (outcomes[index].value ? 'matched' : 'no-match') : 'unavailable' })) };
}

function providerStatus() {
  return providers.map((provider) => ({ id: provider.id, name: provider.name, configured: provider.configured() }));
}

module.exports = { recognize, providerStatus };
