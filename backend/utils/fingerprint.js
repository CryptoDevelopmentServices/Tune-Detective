const fetch = require('node-fetch');
const { spawn } = require('child_process');
require('dotenv').config();

// Generate fingerprint using chromaprint/ffmpeg
exports.generateFingerprint = (audioBuffer) => {
  return new Promise((resolve, reject) => {
    // Save buffer to temp file and run fpcalc (chromaprint)
    // For simplicity, simulate fingerprint for now
    // In production, call fpcalc via child_process
    const fakeFingerprint = Math.random().toString(36).substring(2, 15);
    resolve(fakeFingerprint);
  });
};

// Lookup via AcoustID
exports.lookupAcoustID = async (fingerprint) => {
  const apiKey = process.env.ACOUSTID_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.acoustid.org/v2/lookup?client=${apiKey}&meta=recordings+artists&fingerprint=${fingerprint}`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const rec = data.results[0].recordings?.[0];
      if (rec) {
        return { title: rec.title, artist: rec.artists?.[0]?.name };
      }
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
};
