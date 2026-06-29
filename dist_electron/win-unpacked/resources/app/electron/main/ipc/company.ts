import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/index';

export function registerCompanyHandlers() {
  ipcMain.handle('company:save', async (_event, data: Record<string, unknown>) => {
    const db = getDb();
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO companies (id, name, industry, scale, funding_stage, location_city, location_district, stability_score, promotion_clarity, tags, description, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name,
      data.industry,
      data.scale || 'medium',
      data.fundingStage || null,
      data.location?.city,
      data.location?.district || null,
      data.stabilityScore ?? 50,
      data.promotionClarity ?? 50,
      JSON.stringify(data.tags || []),
      data.description || null,
      data.source || 'manual'
    );
    persist();
    return { id };
  });

  ipcMain.handle('company:getAll', async (_event, filters?: Record<string, unknown>) => {
    const db = getDb();
    let query = 'SELECT * FROM companies WHERE 1=1';
    const params: unknown[] = [];
    
    if (filters?.industry) {
      query += ' AND industry = ?';
      params.push(filters.industry);
    }
    if (filters?.city) {
      query += ' AND location_city = ?';
      params.push(filters.city);
    }
    if (filters?.minStabilityScore) {
      query += ' AND stability_score >= ?';
      params.push(filters.minStabilityScore);
    }
    
    query += ' ORDER BY created_at DESC';
    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      ...row,
      location: {
        city: row.location_city,
        district: row.location_district,
      },
      tags: JSON.parse((row.tags as string) || '[]'),
    }));
  });

  ipcMain.handle('company:get', async (_event, id: string) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      ...row,
      location: {
        city: row.location_city,
        district: row.location_district,
      },
      tags: JSON.parse((row.tags as string) || '[]'),
    };
  });

  ipcMain.handle('company:delete', async (_event, id: string) => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
    stmt.run(id);
    persist();
  });
}
