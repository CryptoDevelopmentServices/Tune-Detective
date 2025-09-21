const express = require('express');
const router = express.Router();
const Sample = require('../models/Sample');

router.post('/', async (req, res) => {
  try {
    const { samples } = req.body; // array of offline stored samples
    const saved = [];

    for (let s of samples) {
      const sample = new Sample(s);
      await sample.save();
      saved.push(sample);
    }

    res.json({ message: 'Offline samples synced', data: saved });
  } catch (err) {
    res.status(500).json({ error: 'Offline sync failed', details: err });
  }
});

module.exports = router;
