const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Training', TrainingSchema);
