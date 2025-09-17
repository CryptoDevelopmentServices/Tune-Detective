const mongoose = require('mongoose');

const LookupSchema = new mongoose.Schema({
  userId: String,
  fingerprint: String,
  result: {
    title: String,
    artist: String,
    source: { type: String, enum: ['acoustid', 'mongodb'] }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lookup', LookupSchema);
