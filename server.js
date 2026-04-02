require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.rotues'); // Ensure this filename is correct
const recordRoutes = require('./src/routes/record.routes');
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests. Please try again later.' },
});

app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);

// Summary routes also exposed at /api/summary
const { getDashboardSummary, getMonthlyTrends } = require('./src/controllers/summary.controller');
const { verifyToken, authorizeRoles } = require('./src/middlewares/auth.middleware');
app.get('/api/summary/dashboard', verifyToken, authorizeRoles('Admin', 'Analyst'), getDashboardSummary);
app.get('/api/summary/trends', verifyToken, authorizeRoles('Admin', 'Analyst'), getMonthlyTrends);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;