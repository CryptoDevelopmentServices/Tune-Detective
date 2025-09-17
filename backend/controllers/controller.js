const Fingerprint = require('../models/Fingerprint');
const Lookup = require('../models/Lookup');
const { generateFingerprint, queryAcoustID } = require('../utils/fingerprintUtils');

exports.recordAudio = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Audio file missing' });
    try {
        const fingerprint = await generateFingerprint(req.file.buffer);
        const acoustidResult = await queryAcoustID(fingerprint);
        res.json({ fingerprint, acoustidResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Recording failed' });
    }
};

exports.matchFingerprint = async (req, res) => {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.status(400).json({ error: 'Fingerprint missing' });
    try {
        let dbMatch = await Fingerprint.findOne({ fingerprint });
        if (dbMatch) return res.json({ title: dbMatch.title, artist: dbMatch.artist, source: 'mongodb' });
        res.json({ title: null, artist: null, source: 'none' });
    } catch (err) {
        res.status(500).json({ error: 'Matching failed' });
    }
};

exports.trainSample = async (req, res) => {
    const { fingerprint, title, artist } = req.body;
    if (!fingerprint || !title || !artist) return res.status(400).json({ error: 'Missing fields' });
    try {
        const sample = new Fingerprint({ fingerprint, title, artist });
        await sample.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Training failed' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await Lookup.find().sort({ createdAt: -1 }).limit(50);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Fetching history failed' });
    }
};
