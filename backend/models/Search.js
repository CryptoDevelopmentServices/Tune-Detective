const mongoose = require('mongoose');

const SearchSchema = new mongoose.Schema({
  query: String,
  type: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Search', SearchSchema);