const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_hackathon_key');
    req.user = decoded;
    next();
  } catch (ex) {
    if (ex.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
};
