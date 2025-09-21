const express = require('express');
const router = express.Router();
const Sample = require('../models/Sample');

router.post('/', async (req, res) => {
  try {
    const { fingerprint, title, artist } = req.body;

    const newSample = new Sample({ fingerprint, title, artist });
    await newSample.save();

    res.json({ message: 'Training sample saved', data: newSample });
  } catch (err) {
    res.status(500).json({ error: 'Training save failed', details: err });
  }
});

module.exports = router;
