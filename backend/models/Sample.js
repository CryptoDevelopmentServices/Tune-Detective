const mongoose = require('mongoose');

const SampleSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true },
  title: { type: String },
  artist: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sample', SampleSchema);
