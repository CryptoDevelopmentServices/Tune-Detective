const mongoose = require('mongoose');

const FingerprintSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true },
  title: String,
  artist: String,
  type: { type: String, enum: ['hum', 'song'], default: 'hum' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fingerprint', FingerprintSchema);
