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
app.use(cors());

// Deep Security: Helmet protects HTTP headers
app.use(helmet());

// Scalability: Compress all API responses to make the app lightning fast
app.use(compression());

// Security: Prevent NoSQL Injection attacks (e.g. {"$gt": ""})
app.use(mongoSanitize());


// Integrity: Rate limiting to prevent brute force and DDoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    app.listen(PORT, () => console.log(`Server actively running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB database connection failure:', err));