const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/:track', async (req, res) => {
  try {
    const { track } = req.params;
    const response = await axios.get(`https://api.musixmatch.com/ws/1.1/track.search`, {
      params: {
        q_track: track,
        apikey: process.env.MUSIXMATCH_API_KEY,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Lyrics fetch failed' });
  }
});

module.exports = router;