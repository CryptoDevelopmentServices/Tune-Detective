const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

const databaseFile = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'tune-detective.sqlite');
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT,
  type TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  provider TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

const insertSearch = db.prepare('INSERT INTO searches (query, type, title, artist, provider) VALUES (@query, @type, @title, @artist, @provider)');
const listSearches = db.prepare('SELECT id, query, type, title, artist, provider, created_at AS createdAt FROM searches ORDER BY id DESC LIMIT ?');

module.exports = {
  create(search) {
    return insertSearch.run({ query: search.query || null, type: search.type, title: search.title || null, artist: search.artist || null, provider: search.provider || null });
  },
  recent(limit = 20) { return listSearches.all(Math.min(Math.max(Number(limit) || 20, 1), 100)); },
};
