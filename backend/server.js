require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const lyricsRoute = require('./routes/lyrics');
const melodyRoute = require('./routes/melody');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/lyrics', lyricsRoute);
app.use('/api/melody', melodyRoute);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));