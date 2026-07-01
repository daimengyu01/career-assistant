import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(__filename);

// Use CommonJS require for sql.js to avoid ESM issues
const sqlJsModule = require('sql.js');
const initSqlJs = (sqlJsModule as any).default || sqlJsModule;

// 定位 sql-wasm.wasm：require.resolve('sql.js') 返回 dist/sql-wasm.js，wasm 在同目录
const sqlJsDir = path.dirname(require.resolve('sql.js'));
const WASM_PATH = path.join(sqlJsDir, 'sql-wasm.wasm');

// 内联 schema，避免构建后找不到 schema.sql
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  major TEXT NOT NULL,
  education TEXT,
  graduation_year INTEGER,
  personality_mbti TEXT,
  personality_extroversion INTEGER DEFAULT 50,
  personality_openness INTEGER DEFAULT 50,
  personality_conscientiousness INTEGER DEFAULT 50,
  personality_agreeableness INTEGER DEFAULT 50,
  personality_neuroticism INTEGER DEFAULT 50,
  interests TEXT DEFAULT '[]',
  career_goals TEXT,
  risk_preference TEXT DEFAULT 'balanced',
  self_intro TEXT,
  resume_path TEXT,
  resume_text TEXT,
  assessment_unlocked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  scale TEXT DEFAULT 'medium',
  funding_stage TEXT,
  location_city TEXT NOT NULL,
  location_district TEXT,
  stability_score INTEGER DEFAULT 50,
  promotion_clarity INTEGER DEFAULT 50,
  company_type TEXT DEFAULT 'stable',
  regional_score INTEGER DEFAULT 50,
  industry_tags TEXT DEFAULT '[]',
  analysis_result TEXT,
  tags TEXT DEFAULT '[]',
  description TEXT,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assessment_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  ai_insights TEXT,
  iteration INTEGER DEFAULT 1,
  conversation_snapshot TEXT,
  final_report TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id)
);
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  match_score INTEGER NOT NULL,
  match_reasons TEXT DEFAULT '[]',
  risk_analysis TEXT,
  action_suggestions TEXT,
  source TEXT DEFAULT 'evaluated',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS search_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS peer_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  extracted_tags TEXT DEFAULT '[]',
  ability_dimensions TEXT DEFAULT '[]',
  suggestions TEXT,
  ai_summary TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id)
);
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT,
  file_path TEXT,
  extracted_text TEXT,
  structured_data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id)
);
CREATE TABLE IF NOT EXISTS job_listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_id TEXT,
  location_city TEXT,
  location_district TEXT,
  salary TEXT,
  tags TEXT DEFAULT '[]',
  source TEXT NOT NULL,
  source_url TEXT,
  description TEXT,
  requirements TEXT,
  collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
`;

type SqlDatabase = any;
let db: SqlDatabase | null = null;

export async function initDatabase() {
  try {
    const SQL = await initSqlJs({
      locateFile: () => WASM_PATH,
    });

    const dbPath = path.join(app.getPath('userData'), 'career-assistant.db');

    let isNewDatabase = false;

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer) as any;
    } else {
      db = new SQL.Database() as any;
      isNewDatabase = true;
    }

    (db as any).run(SCHEMA_SQL);
    
    // 如果是新数据库，添加示例数据
    if (isNewDatabase) {
      addSampleData();
    }
    
    saveDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function addSampleData() {
  if (!db) return;
  
  // 示例公司数据
  const companies = [
    {
      id: 'sample-1',
      name: '腾讯科技',
      industry: '互联网',
      scale: 'large',
      funding_stage: '已上市',
      location_city: '深圳',
      location_district: '南山区',
      stability_score: 90,
      promotion_clarity: 85,
      tags: JSON.stringify(['社交', '游戏', '云计算', '人工智能']),
      description: '中国领先的互联网增值服务提供商',
      source: 'sample',
    },
    {
      id: 'sample-2',
      name: '阿里巴巴集团',
      industry: '电子商务',
      scale: 'large',
      funding_stage: '已上市',
      location_city: '杭州',
      location_district: '余杭区',
      stability_score: 88,
      promotion_clarity: 80,
      tags: JSON.stringify(['电商', '云计算', '金融', '物流']),
      description: '全球最大的电子商务公司之一',
      source: 'sample',
    },
    {
      id: 'sample-3',
      name: '字节跳动',
      industry: '互联网',
      scale: 'large',
      funding_stage: 'D轮',
      location_city: '北京',
      location_district: '海淀区',
      stability_score: 85,
      promotion_clarity: 75,
      tags: JSON.stringify(['短视频', '信息流', '教育', '游戏']),
      description: '全球领先的科技公司，旗下产品包括抖音、今日头条等',
      source: 'sample',
    },
    {
      id: 'sample-4',
      name: '华为技术',
      industry: '通信设备',
      scale: 'large',
      funding_stage: '未上市',
      location_city: '深圳',
      location_district: '龙岗区',
      stability_score: 92,
      promotion_clarity: 88,
      tags: JSON.stringify(['5G', '智能手机', '云计算', '芯片']),
      description: '全球领先的ICT基础设施和智能终端提供商',
      source: 'sample',
    },
    {
      id: 'sample-5',
      name: '小米科技',
      industry: '智能硬件',
      scale: 'large',
      funding_stage: '已上市',
      location_city: '北京',
      location_district: '海淀区',
      stability_score: 82,
      promotion_clarity: 78,
      tags: JSON.stringify(['智能手机', 'IoT', '智能家居', '消费电子']),
      description: '以手机、智能硬件和IoT平台为核心的互联网公司',
      source: 'sample',
    },
    {
      id: 'sample-6',
      name: '美团',
      industry: '本地生活',
      scale: 'large',
      funding_stage: '已上市',
      location_city: '北京',
      location_district: '朝阳区',
      stability_score: 80,
      promotion_clarity: 72,
      tags: JSON.stringify(['外卖', '到店', '酒旅', '出行']),
      description: '中国领先的生活服务电子商务平台',
      source: 'sample',
    },
    {
      id: 'sample-7',
      name: '京东集团',
      industry: '电子商务',
      scale: 'large',
      funding_stage: '已上市',
      location_city: '北京',
      location_district: '大兴区',
      stability_score: 86,
      promotion_clarity: 82,
      tags: JSON.stringify(['电商', '物流', '金融', '健康']),
      description: '中国领先的自营式电商平台',
      source: 'sample',
    },
    {
      id: 'sample-8',
      name: '网易',
      industry: '互联网',
      scale: 'large',
      funding_stage: '已上市',
      location_city: '杭州',
      location_district: '滨江区',
      stability_score: 84,
      promotion_clarity: 76,
      tags: JSON.stringify(['游戏', '音乐', '教育', '电商']),
      description: '中国领先的互联网技术公司',
      source: 'sample',
    },
  ];

  // 插入示例数据
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO companies (id, name, industry, scale, funding_stage, location_city, location_district, stability_score, promotion_clarity, tags, description, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const company of companies) {
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
      company.source
    );
  }
}

function saveDatabase() {
  if (!db) return;
  const dbPath = path.join(app.getPath('userData'), 'career-assistant.db');
  const data = (db as any).export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

export function persist() {
  saveDatabase();
}
