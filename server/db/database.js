'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');

let db = null;

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

async function initDb() {
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '../data/datasnap.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      stripe_customer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stripe_subscription_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      plan TEXT DEFAULT 'pro',
      status TEXT DEFAULT 'active',
      amount INTEGER DEFAULT 300,
      current_period_start DATETIME,
      current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS installs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      extension_id TEXT NOT NULL,
      user_id INTEGER,
      installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin user if not exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@datasnap.pro');
  if (!existing) {
    const hash = await bcrypt.hash('Admin1234!', 10);
    db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run('admin@datasnap.pro', hash, 'Admin', 'admin');
    console.log('Admin user seeded: admin@datasnap.pro');
  }

  console.log('Database initialized at', dbPath);
  return db;
}

module.exports = { getDb, initDb };
