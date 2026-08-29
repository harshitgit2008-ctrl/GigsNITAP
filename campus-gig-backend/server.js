const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const gigRoutes = require('./routes/gigRoutes');

const app = express();

// Security: CORS — restrict to known origins in production
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security: Helmet protects HTTP headers
app.use(helmet());

// Performance: Compress all API responses (Gzip)
app.use(compression());

// Security: Prevent NoSQL Injection attacks
app.use(mongoSanitize());

// Security: Rate limiting to prevent brute force and DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

// Performance: Limit request body size to prevent payload attacks
app.use(express.json({ limit: '1mb' }));

app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);

// Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Integrity: Global error handler — never leak stack traces in production
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    app.listen(PORT, () => console.log(`Server actively running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB database connection failure:', err));
