require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const mongoose = require('mongoose');
const Song = require('./models/Song');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Identify song
app.post('/identify', upload.single('audio'), (req, res) => {
  const filePath = req.file.path;
  exec(`fpcalc -json ${filePath}`, async (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Fingerprinting failed' });

    const result = JSON.parse(stdout);
    const { duration, fingerprint } = result;

    try {
      const response = await axios.get('https://api.acoustid.org/v2/lookup', {
        params: {
          client: process.env.ACOUSTID_API_KEY,
          fingerprint,
          duration,
          meta: 'recordings+releasegroups+compress',
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const best = response.data.results[0].recordings?.[0];
        if (best) {
          const track = {
            title: best.title,
            artist: best.artists?.[0]?.name || "Unknown",
            fingerprint,
            duration,
          };
          await Song.create(track);
          return res.json({ source: "AcoustID", data: track });
        }
      }
      throw new Error("No AcoustID match");
    } catch (apiErr) {
      const fallback = await Song.findOne({ fingerprint: { $regex: fingerprint.slice(0, 30) } });
      if (fallback) return res.json({ source: "Mongo Fallback", data: fallback });
      return res.status(404).json({ error: "No match found" });
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});

// Training mode (add song manually)
app.post('/add-song', async (req, res) => {
  try {
    const song = await Song.create(req.body);
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all songs
app.get('/songs', async (req, res) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.json(songs);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎵 Tune Detective backend running on http://localhost:${PORT}`));
