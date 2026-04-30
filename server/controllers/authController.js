const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');

const isProd = process.env.NODE_ENV === 'production';

// ── Token Generators ──────────────────────────────────────────────────────────
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m', // Short-lived: 15 minutes
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d', // Long-lived: 7 days
  });
};

// Set refresh token as httpOnly cookie (XSS-safe)
const setRefreshCookie = (res, token) => {
  res.cookie('hf_refresh', token, {
    httpOnly: true,          // JS cannot read it
    secure: isProd,          // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax', // Must be 'none' for cross-domain deployment (e.g. Vercel -> Render)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/auth',       // Only sent to auth endpoints
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('hf_refresh', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/api/auth' });
};

const buildUserPayload = (user) => ({
  _id: user._id,
  email: user.email,
  username: user.username,
  avatar: user.avatar,
  xp: user.xp,
  level: user.level,
  badges: user.badges,
  notificationsEnabled: user.notificationsEnabled,
  isPublic: user.isPublic,
  dailyDigestTime: user.dailyDigestTime,
  reminderEmail: user.reminderEmail,
});

// ── @POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already taken' });
    }

    const user = await User.create({ email, passwordHash: password, username });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ accessToken, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

// ── @POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({ accessToken, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

// ── @POST /api/auth/refresh ───────────────────────────────────────────────────
// Client calls this silently when access token expires (every ~14 min)
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.hf_refresh;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Refresh token expired or invalid' });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'User not found' });
    }

    // Rotate: issue new access token + new refresh token
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken: newAccessToken, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

// ── @POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (req, res) => {
  clearRefreshCookie(res);
  res.json({ message: 'Logged out successfully' });
};

// ── @GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json(buildUserPayload(req.user));
};

// ── @POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return same message to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, token, user.username);
    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// ── @POST /api/auth/reset-password/:token ────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or expired' });
    }

    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Don't auto-login after reset — force them to log in properly
    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};

// ── @GET /api/auth/google/callback ───────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    const accessToken = generateAccessToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    setRefreshCookie(res, refreshToken);
    // Redirect with access token — client stores it in memory
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${accessToken}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

module.exports = { register, login, refresh, logout, getMe, forgotPassword, resetPassword, googleCallback };
