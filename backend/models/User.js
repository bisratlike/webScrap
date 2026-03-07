'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned by default queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving.
// The `passwordHash` field stores the plain-text password until this hook
// replaces it with a bcrypt hash. This is intentional: callers set
// `new User({ passwordHash: plainText })` and the hook handles hashing.
// Callers that already have a hash should insert via `collection.insertOne()`
// to bypass this hook (see seedAdmin.js).
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Return a public representation of the user (no passwordHash).
 */
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Virtual: id (string) mirrors _id for API compatibility
UserSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
