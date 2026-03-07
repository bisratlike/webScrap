'use strict';

const mongoose = require('mongoose');

let _connectionPromise = null;

/**
 * Connect to MongoDB.
 * Calling this multiple times is safe – it returns the cached promise.
 *
 * @param {string} [uri] – override the default MONGODB_URI (useful in tests)
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDb(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const url = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/datasnap';

  if (!_connectionPromise) {
    _connectionPromise = mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
    }).then(() => {
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return mongoose.connection;
    });
  }

  return _connectionPromise;
}

/**
 * Disconnect from MongoDB (used in tests).
 */
async function disconnectDb() {
  await mongoose.disconnect();
  _connectionPromise = null;
}

module.exports = { connectDb, disconnectDb };
