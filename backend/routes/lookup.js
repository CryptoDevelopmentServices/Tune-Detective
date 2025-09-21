const express = require('express');
const router = express.Router();
const Lookup = require('../models/Lookup');
const { identifySong } = require('../utils/acoustid');

router.post('/audio', async (req, res) => {
  try {
    const result = await identifySong(req.body.filePath);
    const lookup = new Lookup({ query: "audio", result });
    await lookup.save();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lyrics', async (req, res) => {
  try {
    const lyrics = req.body.lyrics;
    const result = { title: "Sample Song", artist: "Demo Artist", lyrics };
    const lookup = new Lookup({ query: lyrics, result });
    await lookup.save();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
