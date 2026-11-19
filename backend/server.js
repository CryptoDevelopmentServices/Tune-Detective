require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Search = require('./models/Search');
const lyricsRoute = require('./routes/lyrics');
const melodyRoute = require('./routes/melody');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/lyrics', lyricsRoute);
app.use('/api/melody', melodyRoute);

app.listen(PORT, '0.0.0.0', () => console.log(`API ready on port ${PORT}; SQLite history enabled.`));
