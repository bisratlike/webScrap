'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function signToken(userId) {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email, and password are required');
  }

  const user = new User({ name, email: email.toLowerCase(), passwordHash: password });
  await user.save();

  const token = signToken(user._id);
  res.status(201).json({ token, user: user.toJSON() });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const match = await user.comparePassword(password);
  if (!match) throw ApiError.unauthorized('Invalid credentials');

  const token = signToken(user._id);
  res.json({ token, user: user.toJSON() });
});

// POST /api/auth/logout
const logout = (req, res) => {
  res.json({ success: true });
};

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

module.exports = { signup, login, logout, me };
