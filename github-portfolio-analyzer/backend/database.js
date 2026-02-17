import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'scores.db');

let db;

export async function initDB() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS score_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('Database initialized at', dbPath);
}

export async function saveScore(username, score, timestamp = Date.now()) {
    if (!db) await initDB();
    const normalizedUsername = username.toLowerCase();
    await db.run(
        'INSERT INTO score_history (username, score, timestamp) VALUES (?, ?, ?)',
        [normalizedUsername, score, timestamp]
    );
}

export async function getHistory(username) {
    if (!db) await initDB();
    const normalizedUsername = username.toLowerCase();
    return await db.all(
        'SELECT score, timestamp FROM score_history WHERE username = ? ORDER BY timestamp ASC',
        [normalizedUsername]
    );
}
