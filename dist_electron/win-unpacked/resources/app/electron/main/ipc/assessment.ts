import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/index';

export function registerAssessmentHandlers() {
  ipcMain.handle('assessment:save', async (_event, data: Record<string, unknown>) => {
    const db = getDb();
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO assessment_results (id, user_id, type, data, ai_insights)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.userId || 'default',
      data.type,
      JSON.stringify(data.data || {}),
      data.aiInsights || null
    );
    persist();
    return { id };
  });

  ipcMain.handle('assessment:getAll', async () => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM assessment_results ORDER BY created_at DESC');
    const rows = stmt.all() as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      ...row,
      data: JSON.parse((row.data as string) || '{}'),
    }));
  });
}
