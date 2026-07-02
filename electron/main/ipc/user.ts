import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { persist, queryOne, executeRun } from '../db/index';
import path from 'path';

// 动态 import pdfjs-dist（避免构建时顶层 await 问题）
let pdfjsLib: typeof import('pdfjs-dist/legacy/build/pdf.mjs') | null = null;
async function getPdfjsLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

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
      const row = queryOne('SELECT * FROM user_profiles WHERE id = ?', [userId]);
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

      executeRun(
        `INSERT OR REPLACE INTO user_profiles (
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
        )`,
        [
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
          id,
        ]
      );
      persist();

      // 返回保存后的档案
      const row = queryOne('SELECT * FROM user_profiles WHERE id = ?', [id]);
      return normalizeProfile(row as Record<string, unknown>);
    } catch (error) {
      console.error('user:saveProfile error:', error);
      throw error;
    }
  });

  // 读取最新简历
  ipcMain.handle('user:getResume', async (_event, userId: string = 'default') => {
    try {
      const row = queryOne(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
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
      const id = (data.id as string) || uuidv4();
      const userId = (data.userId as string) || (data.user_id as string) || 'default';

      executeRun(
        `INSERT INTO resumes (id, user_id, file_name, file_path, extracted_text, structured_data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          data.filename ?? data.fileName ?? data.file_name ?? null,
          data.filePath ?? data.file_path ?? null,
          data.parsedText ?? data.parsed_text ?? data.extractedText ?? data.extracted_text ?? null,
          normalizeJsonField(data.content ?? data.structuredData ?? data.structured_data ?? '{}'),
        ]
      );
      persist();

      const row = queryOne('SELECT * FROM resumes WHERE id = ?', [id]);
      return normalizeResume(row as Record<string, unknown>);
    } catch (error) {
      console.error('user:saveResume error:', error);
      throw error;
    }
  });

  // 提取 PDF 文本
  ipcMain.handle('user:extractPdfText', async (_event, filePath: string) => {
    try {
      if (!filePath) throw new Error('未提供文件路径');

      // 路径穿越防护：禁止读取 Windows 系统目录，且必须为 .pdf 扩展名
      const resolved = path.resolve(filePath);
      if (process.platform === 'win32' && /[\\/]Windows[\\/](System32|config|drivers)/i.test(resolved)) {
        return { success: false, text: '不允许读取系统目录文件', pageCount: 0 };
      }
      if (!/\.pdf$/i.test(resolved)) {
        return { success: false, text: '仅支持 PDF 文件', pageCount: 0 };
      }

      const fs = await import('fs');
      if (!fs.existsSync(filePath)) throw new Error(`文件不存在: ${filePath}`);

      // 文件大小限制：超过 20MB 拒绝
      const stat = fs.statSync(filePath);
      if (stat.size > 20 * 1024 * 1024) {
        return { success: false, text: 'PDF 文件过大（超过 20MB）', pageCount: 0 };
      }

      const lib = await getPdfjsLib();
      const data = new Uint8Array(fs.readFileSync(filePath));
      const doc = await lib.getDocument({ data, isEvalSupported: false, disableJavaScript: true }).promise;
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: { str?: string }) => item.str || '').join(' ') + '\n';
      }
      return { success: true, text: text.trim(), pageCount: doc.numPages };
    } catch (error) {
      console.error('user:extractPdfText error:', error);
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

/** JSON 安全解析，失败返回 fallback */
function safeJsonParse<T>(s: string | null | undefined, fb: T): T {
  if (!s) return fb;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
}

/**
 * 将数据库行规范化为前端友好的档案对象（camelCase 嵌套结构）。
 * career_goals 中若内嵌 extra（identity/gender/skills/values），提取到顶层。
 */
function normalizeProfile(row: Record<string, unknown>) {
  if (!row) return null;
  const r = row as Record<string, unknown>;

  // 解析 career_goals：可能为 { careerGoals, extra } 结构
  let careerGoals: unknown = {};
  let extra: Record<string, unknown> | undefined;
  const rawGoals = r.career_goals as string | null | undefined;
  if (rawGoals) {
    const parsed = safeJsonParse<unknown>(rawGoals, null);
    if (parsed && typeof parsed === 'object' && 'extra' in (parsed as Record<string, unknown>)) {
      const obj = parsed as Record<string, unknown>;
      extra = obj.extra as Record<string, unknown> | undefined;
      careerGoals = obj.careerGoals ?? {};
    } else {
      careerGoals = parsed ?? {};
    }
  }

  return {
    id: r.id,
    name: r.name,
    age: r.age,
    major: r.major,
    education: r.education,
    graduationYear: r.graduation_year,
    personality: {
      mbti: r.personality_mbti,
      extroversion: r.personality_extroversion,
      openness: r.personality_openness,
      conscientiousness: r.personality_conscientiousness,
      agreeableness: r.personality_agreeableness,
      neuroticism: r.personality_neuroticism,
    },
    interests: safeJsonParse<string[]>(r.interests as string, []),
    selfIntro: r.self_intro,
    resumeText: r.resume_text,
    resumePath: r.resume_path,
    assessmentUnlocked: Boolean(r.assessment_unlocked),
    riskPreference: r.risk_preference,
    careerGoals,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...(extra || {}),
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
