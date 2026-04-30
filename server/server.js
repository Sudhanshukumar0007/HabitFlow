require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const analyticsRoutes = require('./routes/analytics');
const noteRoutes = require('./routes/notes');
const userRoutes = require('./routes/user');
const exportRoutes = require('./routes/export');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Connect DB
connectDB();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Logging ───────────────────────────────────────────────────────────────────
// Use 'combined' (Apache-format) in prod, 'dev' (colorized) in dev
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Global limiter — 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Strict limiter for auth endpoints — 10 attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // only count failures
});

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' })); // reduced from 10mb — habits don't need more
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── NoSQL Injection Sanitization ──────────────────────────────────────────────
// Strips $ and . from user-supplied data to prevent MongoDB operator injection
app.use(mongoSanitize({ replaceWith: '_' }));

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes); // auth routes get strict limiter
app.use('/api/habits', habitRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/user', userRoutes);
app.use('/api/export', exportRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development', timestamp: new Date() })
);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${isProd ? 'PRODUCTION' : 'development'} mode on port ${PORT}`);
});

module.exports = app;
