const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'products.db');
const db = new Database(dbPath);

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    price REAL NOT NULL,
    prev_price REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_name, brand_name)
  )
`);

// Migration for existing database
try {
  db.exec('ALTER TABLE products ADD COLUMN prev_price REAL DEFAULT 0');
} catch (e) {
  // Column might already exist
}

console.log('Database initialized at', dbPath);

module.exports = db;
