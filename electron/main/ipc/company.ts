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

  // 自动评估公司评分
  ipcMain.handle('company:autoEvaluate', async (_event, companyId: string) => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
      const row = stmt.get(companyId) as Record<string, unknown> | undefined;
      if (!row) {
        throw new Error(`未找到公司: ${companyId}`);
      }

      const fundingStage = String(row.funding_stage || '');
      const scale = row.scale;
      const industry = String(row.industry || '');
      const city = String(row.location_city || '');

      // 1. 稳定性：基于融资阶段
      const stability = scoreStability(fundingStage);
      // 2. 晋升清晰度：基于规模（人数）
      const promotion = scorePromotion(scale);
      // 3. 行业前景
      const industryScore = scoreIndustry(industry);
      // 4. 地域发展
      const regional = scoreRegional(city);

      // 综合评分 = 加权平均
      // 权重：稳定性 0.3、晋升清晰度 0.25、行业前景 0.25、地域发展 0.2
      const weights = { stability: 0.3, promotion: 0.25, industry: 0.25, regional: 0.2 };
      const overall = Math.round(
        stability * weights.stability +
          promotion * weights.promotion +
          industryScore * weights.industry +
          regional * weights.regional
      );

      const reasons: string[] = [
        `稳定性评分 ${stability}/15：${stabilityReason(fundingStage)}`,
        `晋升清晰度评分 ${promotion}/15：${promotionReason(scale)}`,
        `行业前景评分 ${industryScore}/15：${industryReason(industry)}`,
        `地域发展评分 ${regional}/15：${regionalReason(city)}`,
        `综合评分 ${overall}/15（加权平均：稳定性 30%、晋升清晰度 25%、行业前景 25%、地域发展 20%）`,
      ];

      const scores = {
        stability,
        promotion,
        industry: industryScore,
        regional,
        overall,
      };

      const analysisResult = JSON.stringify({
        scores,
        reasons,
        weights,
        evaluatedAt: new Date().toISOString(),
        input: {
          fundingStage,
          scale,
          industry,
          city,
        },
      });

      // 更新 companies 表的评分与分析结果
      const updateStmt = db.prepare(`
        UPDATE companies
        SET stability_score = ?,
            promotion_clarity = ?,
            regional_score = ?,
            analysis_result = ?
        WHERE id = ?
      `);
      updateStmt.run(
        Math.round((stability / 15) * 100),
        Math.round((promotion / 15) * 100),
        Math.round((regional / 15) * 100),
        analysisResult,
        companyId
      );
      persist();

      return { success: true, scores, reasons };
    } catch (error) {
      console.error('company:autoEvaluate error:', error);
      throw error;
    }
  });
}

/** 稳定性评分：基于融资阶段 */
function scoreStability(fundingStage: string): number {
  const stage = fundingStage.toLowerCase();
  if (/上市|public|listed|ipo/.test(stage)) return 15;
  if (/c轮|^c$|c\+/.test(stage)) return 12;
  if (/b轮|^b$|b\+/.test(stage)) return 8;
  if (/a轮|^a$|a\+/.test(stage)) return 5;
  if (/天使|angel/.test(stage)) return 2;
  return 5;
}

function stabilityReason(fundingStage: string): string {
  if (!fundingStage) return '未提供融资阶段，按其他计 5 分';
  return `融资阶段为「${fundingStage}」`;
}

/** 晋升清晰度评分：基于公司规模/人数 */
function scorePromotion(scale: unknown): number {
  // 若 scale 是数字或数字字符串，直接按人数判断
  if (typeof scale === 'number') {
    return headcountToScore(scale);
  }
  if (typeof scale === 'string') {
    const numeric = parseInt(scale, 10);
    if (!Number.isNaN(numeric) && /^\d+$/.test(scale.trim())) {
      return headcountToScore(numeric);
    }
    // 类别映射
    const s = scale.toLowerCase();
    if (/mega|xlarge|超大|万|超大型/.test(s)) return 15;
    if (/large|大|big/.test(s)) return 12;
    if (/medium|中|mid/.test(s)) return 8;
    if (/small|startup|小|创业|tiny/.test(s)) return 5;
  }
  return 5;
}

function headcountToScore(headcount: number): number {
  if (headcount > 10000) return 15;
  if (headcount >= 1000) return 12;
  if (headcount >= 100) return 8;
  return 5;
}

function promotionReason(scale: unknown): string {
  if (typeof scale === 'number') return `规模约 ${scale} 人`;
  if (typeof scale === 'string') {
    const numeric = parseInt(scale, 10);
    if (!Number.isNaN(numeric) && /^\d+$/.test(scale.trim())) return `规模约 ${numeric} 人`;
    return `规模类别为「${scale}」`;
  }
  return '未提供规模信息，按其他计 5 分';
}

/** 行业前景评分 */
function scoreIndustry(industry: string): number {
  const ind = industry.toLowerCase();
  if (/ai|人工智能|大模型|机器学习|新能源|清洁能源|光伏|锂电|生物|医药|医疗器械|基因|创新药/.test(ind)) {
    return 15;
  }
  if (/互联网|科技|软件|信息技术|it|云计算|大数据|半导体|芯片|通信/.test(ind)) {
    return 12;
  }
  if (/金融|银行|证券|保险|投资|基金|fintech|金融科技/.test(ind)) {
    return 10;
  }
  return 5;
}

function industryReason(industry: string): string {
  if (!industry) return '未提供行业信息，按传统行业计 5 分';
  return `行业为「${industry}」`;
}

/** 地域发展评分 */
function scoreRegional(city: string): number {
  const tier1 = ['北京', '上海', '广州', '深圳'];
  const tierNew1 = [
    '杭州', '成都', '武汉', '南京', '苏州', '西安', '重庆', '天津',
    '长沙', '青岛', '郑州', '东莞', '宁波', '昆明', '合肥', '佛山',
  ];
  const tier2 = [
    '厦门', '大连', '济南', '哈尔滨', '沈阳', '福州', '无锡', '珠海',
    '温州', '石家庄', '长春', '南昌', '贵阳', '太原', '南宁', '兰州',
  ];
  if (tier1.includes(city)) return 15;
  if (tierNew1.includes(city)) return 12;
  if (tier2.includes(city)) return 8;
  return 5;
}

function regionalReason(city: string): string {
  if (!city) return '未提供城市信息，按其他计 5 分';
  return `所在城市为「${city}」`;
}
