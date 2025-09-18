require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes/routes');
const morgan = require('morgan'); // 🔹 logging
const helmet = require('helmet'); // 🔹 security headers

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));   // log requests in console
app.use(helmet());        // secure HTTP headers

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/ping', (req, res) => res.json({ status: 'ok', message: 'pong' }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
