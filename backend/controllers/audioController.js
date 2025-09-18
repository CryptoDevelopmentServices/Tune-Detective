const { lookupAcoustID, generateFingerprint } = require('../utils/fingerprint');
const Training = require('../models/Training');

// Handle audio recording lookup
exports.handleRecord = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio uploaded' });

    // Generate fingerprint from raw audio
    const fingerprint = await generateFingerprint(req.file.buffer);

    // Try AcoustID first
    const acoustidResult = await lookupAcoustID(fingerprint);

    if (acoustidResult) {
      return res.json({
        title: acoustidResult.title,
        artist: acoustidResult.artist,
        source: 'acoustid',
        fingerprint
      });
    }

    // Fallback: check MongoDB training samples
    const fallback = await Training.findOne({ fingerprint });
    if (fallback) {
      return res.json({
        title: fallback.title,
        artist: fallback.artist,
        source: 'mongo',
        fingerprint
      });
    }

    // If no match, return partial result
    res.json({ source: 'none', fingerprint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handle saving training samples
exports.handleTrain = async (req, res) => {
  try {
    const { fingerprint, title, artist } = req.body;
    if (!fingerprint || !title || !artist) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const training = new Training({ fingerprint, title, artist });
    await training.save();

    res.json({ message: 'Training data saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
