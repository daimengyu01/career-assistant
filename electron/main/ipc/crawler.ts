import { ipcMain, dialog } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/index';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export function registerCrawlerHandlers() {
  ipcMain.handle('crawler:import', async (_event, format: string, data: unknown) => {
    const db = getDb();
    let items: Array<Record<string, unknown>> = [];
    
    if (format === 'json') {
      items = data as Array<Record<string, unknown>>;
    } else if (format === 'csv') {
      const csv = data as string;
      const lines = csv.split('\n').filter((l) => l.trim());
      if (lines.length < 2) return { success: false, count: 0 };
      const headers = lines[0].split(',').map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const obj: Record<string, unknown> = {};
        headers.forEach((h, idx) => { obj[h] = values[idx]; });
        items.push(obj);
      }
    }

    let count = 0;
    for (const item of items) {
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO companies (id, name, industry, scale, funding_stage, location_city, stability_score, promotion_clarity, tags, description, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        id,
        item.name || item.company_name || 'Unknown',
        item.industry || 'Unknown',
        item.scale || 'medium',
        item.funding_stage || item.fundingStage || null,
        item.location_city || item.city || 'Unknown',
        item.stability_score ?? item.stabilityScore ?? 50,
        item.promotion_clarity ?? item.promotionClarity ?? 50,
        JSON.stringify(item.tags || []),
        item.description || null,
        'import'
      );
      if (result.changes > 0) count++;
    }
    persist();
    return { success: true, count };
  });

  ipcMain.handle('crawler:getSources', async () => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM data_sources ORDER BY created_at DESC');
    return stmt.all() as Array<Record<string, unknown>>;
  });

  ipcMain.handle('crawler:saveSource', async (_event, config: Record<string, unknown>) => {
    const db = getDb();
    const id = config.id || uuidv4();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO data_sources (id, name, type, config)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, config.name, config.type, JSON.stringify(config));
    persist();
    return { id };
  });

  ipcMain.handle('crawler:fetchFromApi', async (_event, sourceId: string) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM data_sources WHERE id = ?');
    const source = stmt.get(sourceId) as Record<string, unknown> | undefined;
    if (!source) throw new Error('Data source not found');
    
    const config = JSON.parse(source.config as string);
    const response = await axios.get(config.baseUrl + (config.endpoints?.positions || '/jobs'), {
      headers: config.headers || {},
    });
    
    return response.data;
  });
}
