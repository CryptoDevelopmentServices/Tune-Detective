const mongoose = require('mongoose');

const LookupSchema = new mongoose.Schema({
  query: String,
  result: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lookup', LookupSchema);
