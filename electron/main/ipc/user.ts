import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/index';

/**
 * 用户档案与简历 IPC 处理器
 *
 * 字段映射说明（任务描述字段 -> 实际 schema.sql 列）：
 *   school          -> education
 *   mbti_type/mbti  -> personality_mbti
 *   interests       -> interests（数组会被 JSON.stringify）
 *   skills/values/gender/identity -> 当前 schema 无独立列，统一存入 career_goals（JSON）
 */

export function registerUserHandlers() {
  // 读取用户档案（单行，id='default'）
  ipcMain.handle('user:getProfile', async (_event, userId: string = 'default') => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM user_profiles WHERE id = ?');
      const row = stmt.get(userId) as Record<string, unknown> | undefined;
      if (!row) return null;
      return normalizeProfile(row);
    } catch (error) {
      console.error('user:getProfile error:', error);
      throw error;
    }
  });

  // 写入用户档案（INSERT OR REPLACE）
  ipcMain.handle('user:saveProfile', async (_event, data: Record<string, unknown> = {}) => {
    try {
      const db = getDb();
      const id = (data.id as string) || 'default';

      // 收集 schema 中无独立列的扩展字段，序列化进 career_goals
      const extraFields: Record<string, unknown> = {};
      for (const key of ['gender', 'identity', 'skills', 'values']) {
        if (data[key] !== undefined) {
          extraFields[key] = data[key];
        }
      }
      let careerGoals = data.careerGoals ?? data.career_goals ?? null;
      if (Object.keys(extraFields).length > 0) {
        const extraJson = JSON.stringify(extraFields);
        careerGoals = careerGoals
          ? JSON.stringify({ careerGoals, extra: extraFields })
          : extraJson;
      }

      const interests = normalizeJsonField(data.interests ?? data.interest);
      const resumeText = data.resumeText ?? data.resume_text ?? null;

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_profiles (
          id, name, age, major, education, graduation_year, personality_mbti,
          personality_extroversion, personality_openness, personality_conscientiousness,
          personality_agreeableness, personality_neuroticism, interests, career_goals,
          risk_preference, self_intro, resume_path, resume_text, assessment_unlocked,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          COALESCE((SELECT created_at FROM user_profiles WHERE id = ?), CURRENT_TIMESTAMP),
          CURRENT_TIMESTAMP
        )
      `);

      stmt.run(
        id,
        data.name ?? '',
        data.age ?? 0,
        data.major ?? '',
        data.education ?? data.school ?? null,
        data.graduationYear ?? data.graduation_year ?? null,
        data.mbtiType ?? data.mbti ?? data.personalityMbti ?? data.personality_mbti ?? null,
        data.personalityExtroversion ?? data.personality_extroversion ?? 50,
        data.personalityOpenness ?? data.personality_openness ?? 50,
        data.personalityConscientiousness ?? data.personality_conscientiousness ?? 50,
        data.personalityAgreeableness ?? data.personality_agreeableness ?? 50,
        data.personalityNeuroticism ?? data.personality_neuroticism ?? 50,
        interests,
        careerGoals,
        data.riskPreference ?? data.risk_preference ?? 'balanced',
        data.selfIntro ?? data.self_intro ?? null,
        data.resumePath ?? data.resume_path ?? null,
        resumeText,
        data.assessmentUnlocked ?? data.assessment_unlocked ?? 0,
        id
      );
      persist();

      // 返回保存后的档案
      const selectStmt = db.prepare('SELECT * FROM user_profiles WHERE id = ?');
      const row = selectStmt.get(id) as Record<string, unknown> | undefined;
      return normalizeProfile(row as Record<string, unknown>);
    } catch (error) {
      console.error('user:saveProfile error:', error);
      throw error;
    }
  });

  // 读取最新简历
  ipcMain.handle('user:getResume', async (_event, userId: string = 'default') => {
    try {
      const db = getDb();
      const stmt = db.prepare(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
      );
      const row = stmt.get(userId) as Record<string, unknown> | undefined;
      if (!row) return null;
      return normalizeResume(row);
    } catch (error) {
      console.error('user:getResume error:', error);
      throw error;
    }
  });

  // 写入简历
  ipcMain.handle('user:saveResume', async (_event, data: Record<string, unknown> = {}) => {
    try {
      const db = getDb();
      const id = (data.id as string) || uuidv4();
      const userId = (data.userId as string) || (data.user_id as string) || 'default';

      const stmt = db.prepare(`
        INSERT INTO resumes (id, user_id, file_name, file_path, extracted_text, structured_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        userId,
        data.filename ?? data.fileName ?? data.file_name ?? null,
        data.filePath ?? data.file_path ?? null,
        data.parsedText ?? data.parsed_text ?? data.extractedText ?? data.extracted_text ?? null,
        normalizeJsonField(data.content ?? data.structuredData ?? data.structured_data ?? '{}')
      );
      persist();

      const selectStmt = db.prepare('SELECT * FROM resumes WHERE id = ?');
      const row = selectStmt.get(id) as Record<string, unknown> | undefined;
      return normalizeResume(row as Record<string, unknown>);
    } catch (error) {
      console.error('user:saveResume error:', error);
      throw error;
    }
  });
}

/** 将 interests 等字段统一序列化为 JSON 字符串 */
function normalizeJsonField(value: unknown): string {
  if (value === null || value === undefined) return '[]';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/** 将数据库行规范化为前端友好的档案对象 */
function normalizeProfile(row: Record<string, unknown>): Record<string, unknown> {
  if (!row) return row;
  let interests: unknown = row.interests;
  try {
    interests = JSON.parse((row.interests as string) || '[]');
  } catch {
    // 保持原值
  }
  let careerGoals: unknown = row.career_goals;
  let extra: Record<string, unknown> | undefined;
  try {
    const parsed = JSON.parse((row.career_goals as string) || 'null');
    if (parsed && typeof parsed === 'object' && 'extra' in parsed) {
      extra = (parsed as Record<string, unknown>).extra as Record<string, unknown>;
      careerGoals = (parsed as Record<string, unknown>).careerGoals ?? null;
    } else {
      careerGoals = parsed;
    }
  } catch {
    // 保持原值
  }
  return {
    ...row,
    interests,
    careerGoals,
    ...(extra ? { extra } : {}),
  };
}

/** 将数据库行规范化为前端友好的简历对象 */
function normalizeResume(row: Record<string, unknown>): Record<string, unknown> {
  if (!row) return row;
  let structuredData: unknown = row.structured_data;
  try {
    structuredData = JSON.parse((row.structured_data as string) || '{}');
  } catch {
    // 保持原值
  }
  return {
    ...row,
    filename: row.file_name,
    filePath: row.file_path,
    parsedText: row.extracted_text,
    content: row.structured_data,
    structuredData,
  };
}
