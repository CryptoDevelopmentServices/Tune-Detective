const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  fingerprint: String,
  duration: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Song', SongSchema);
