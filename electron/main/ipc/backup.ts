import { ipcMain, dialog } from 'electron';
import { getDb, persist } from '../db/index';
import fs from 'fs';

export function registerBackupHandlers() {
  ipcMain.handle('data:export', async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '导出数据',
        defaultPath: 'career-assistant-backup.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (canceled || !filePath) {
        return { success: false };
      }

      const db = getDb();
      
      // 导出所有表的数据
      const companies = db.prepare('SELECT * FROM companies').all();
      const assessments = db.prepare('SELECT * FROM assessment_results').all();
      const recommendations = db.prepare('SELECT * FROM recommendations').all();
      const dataSources = db.prepare('SELECT * FROM data_sources').all();

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          companies,
          assessments,
          recommendations,
          dataSources,
        },
      };

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  });

  ipcMain.handle('data:import', async (_event, backupData: Record<string, unknown>) => {
    try {
      const db = getDb();
      let count = 0;

      if (backupData.data && typeof backupData.data === 'object') {
        const data = backupData.data as Record<string, unknown[]>;

        // 导入公司数据
        if (data.companies && Array.isArray(data.companies)) {
          for (const company of data.companies) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO companies (id, name, industry, scale, funding_stage, location_city, location_district, stability_score, promotion_clarity, tags, description, source, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
              company.id,
              company.name,
              company.industry,
              company.scale,
              company.funding_stage,
              company.location_city,
              company.location_district,
              company.stability_score,
              company.promotion_clarity,
              company.tags,
              company.description,
              company.source,
              company.created_at
            );
            count++;
          }
        }

        // 导入评估结果
        if (data.assessments && Array.isArray(data.assessments)) {
          for (const assessment of data.assessments) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO assessment_results (id, user_id, type, data, ai_insights, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
              assessment.id,
              assessment.user_id,
              assessment.type,
              assessment.data,
              assessment.ai_insights,
              assessment.created_at
            );
            count++;
          }
        }

        // 导入推荐记录
        if (data.recommendations && Array.isArray(data.recommendations)) {
          for (const recommendation of data.recommendations) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO recommendations (id, user_id, company_id, match_score, match_reasons, risk_analysis, action_suggestions, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
              recommendation.id,
              recommendation.user_id,
              recommendation.company_id,
              recommendation.match_score,
              recommendation.match_reasons,
              recommendation.risk_analysis,
              recommendation.action_suggestions,
              recommendation.created_at
            );
            count++;
          }
        }

        // 导入数据源配置
        if (data.dataSources && Array.isArray(data.dataSources)) {
          for (const dataSource of data.dataSources) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO data_sources (id, name, type, config, created_at)
              VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run(
              dataSource.id,
              dataSource.name,
              dataSource.type,
              dataSource.config,
              dataSource.created_at
            );
            count++;
          }
        }
      }

      persist();
      return { success: true, count };
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  });
}
