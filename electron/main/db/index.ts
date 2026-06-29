import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: SqlJsDatabase | null = null;

export async function initDatabase() {
  const SQL = await initSqlJs();
  const dbPath = path.join(app.getPath('userData'), 'career-assistant.db');
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.run(schema);
  saveDatabase();
}

function saveDatabase() {
  if (!db) return;
  const dbPath = path.join(app.getPath('userData'), 'career-assistant.db');
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function persist() {
  saveDatabase();
}
