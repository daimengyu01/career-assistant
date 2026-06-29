/**
 * 数据库 Schema 定义（TypeScript 版本）
 * 用于数据库迁移和类型检查
 */

export type TableName = 'users' | 'companies' | 'assessments' | 'data_sources' | 'settings';

export type ColumnType = 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'BOOLEAN';

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  nullable: boolean;
  defaultValue?: unknown;
  primaryKey?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
}

export interface TableSchema {
  name: TableName;
  columns: ColumnDefinition[];
  indexes?: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
}

export interface SchemaVersion {
  version: number;
  name: string;
  up: string;
  down: string;
}

/**
 * 用户表 Schema
 */
export const usersSchema: TableSchema = {
  name: 'users',
  columns: [
    { name: 'id', type: 'TEXT', nullable: false, primaryKey: true },
    { name: 'name', type: 'TEXT', nullable: false },
    { name: 'age', type: 'INTEGER', nullable: false },
    { name: 'major', type: 'TEXT', nullable: false },
    { name: 'education', type: 'TEXT', nullable: true },
    { name: 'graduation_year', type: 'INTEGER', nullable: true },
    { name: 'personality_mbti', type: 'TEXT', nullable: true },
    { name: 'personality_extroversion', type: 'REAL', nullable: true },
    { name: 'personality_openness', type: 'REAL', nullable: true },
    { name: 'personality_conscientiousness', type: 'REAL', nullable: true },
    { name: 'personality_agreeableness', type: 'REAL', nullable: true },
    { name: 'personality_neuroticism', type: 'REAL', nullable: true },
    { name: 'interests', type: 'TEXT', nullable: true },
    { name: 'career_goals', type: 'TEXT', nullable: true },
    { name: 'risk_preference', type: 'TEXT', nullable: true, defaultValue: 'balanced' },
    { name: 'created_at', type: 'TEXT', nullable: false },
    { name: 'updated_at', type: 'TEXT', nullable: false },
  ],
  indexes: [
    { name: 'idx_users_created_at', columns: ['created_at'] },
  ],
};

/**
 * 公司表 Schema
 */
export const companiesSchema: TableSchema = {
  name: 'companies',
  columns: [
    { name: 'id', type: 'TEXT', nullable: false, primaryKey: true },
    { name: 'name', type: 'TEXT', nullable: false },
    { name: 'industry', type: 'TEXT', nullable: false },
    { name: 'scale', type: 'TEXT', nullable: false },
    { name: 'funding_stage', type: 'TEXT', nullable: true },
    { name: 'location_city', type: 'TEXT', nullable: false },
    { name: 'location_district', type: 'TEXT', nullable: true },
    { name: 'stability_score', type: 'REAL', nullable: false, defaultValue: 50 },
    { name: 'promotion_clarity', type: 'REAL', nullable: false, defaultValue: 50 },
    { name: 'tags', type: 'TEXT', nullable: true },
    { name: 'description', type: 'TEXT', nullable: true },
    { name: 'source', type: 'TEXT', nullable: true },
    { name: 'created_at', type: 'TEXT', nullable: false },
  ],
  indexes: [
    { name: 'idx_companies_industry', columns: ['industry'] },
    { name: 'idx_companies_city', columns: ['location_city'] },
    { name: 'idx_companies_created_at', columns: ['created_at'] },
  ],
};

/**
 * 测评结果表 Schema
 */
export const assessmentsSchema: TableSchema = {
  name: 'assessments',
  columns: [
    { name: 'id', type: 'TEXT', nullable: false, primaryKey: true },
    { name: 'user_id', type: 'TEXT', nullable: false },
    { name: 'type', type: 'TEXT', nullable: false },
    { name: 'data', type: 'TEXT', nullable: false },
    { name: 'ai_insights', type: 'TEXT', nullable: true },
    { name: 'created_at', type: 'TEXT', nullable: false },
  ],
  indexes: [
    { name: 'idx_assessments_user_id', columns: ['user_id'] },
    { name: 'idx_assessments_type', columns: ['type'] },
    { name: 'idx_assessments_created_at', columns: ['created_at'] },
  ],
};

/**
 * 数据源表 Schema
 */
export const dataSourcesSchema: TableSchema = {
  name: 'data_sources',
  columns: [
    { name: 'id', type: 'TEXT', nullable: false, primaryKey: true },
    { name: 'name', type: 'TEXT', nullable: false },
    { name: 'type', type: 'TEXT', nullable: false },
    { name: 'config', type: 'TEXT', nullable: true },
    { name: 'enabled', type: 'BOOLEAN', nullable: false, defaultValue: 1 },
    { name: 'created_at', type: 'TEXT', nullable: false },
  ],
};

/**
 * 设置表 Schema
 */
export const settingsSchema: TableSchema = {
  name: 'settings',
  columns: [
    { name: 'key', type: 'TEXT', nullable: false, primaryKey: true },
    { name: 'value', type: 'TEXT', nullable: true },
    { name: 'updated_at', type: 'TEXT', nullable: false },
  ],
};

/**
 * 所有表 Schema
 */
export const ALL_SCHEMAS: TableSchema[] = [
  usersSchema,
  companiesSchema,
  assessmentsSchema,
  dataSourcesSchema,
  settingsSchema,
];

/**
 * 迁移版本定义
 */
export const SCHEMA_VERSIONS: SchemaVersion[] = [
  {
    version: 1,
    name: 'initial',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        major TEXT NOT NULL,
        education TEXT,
        graduation_year INTEGER,
        personality_mbti TEXT,
        personality_extroversion REAL,
        personality_openness REAL,
        personality_conscientiousness REAL,
        personality_agreeableness REAL,
        personality_neuroticism REAL,
        interests TEXT,
        career_goals TEXT,
        risk_preference TEXT DEFAULT 'balanced',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        scale TEXT NOT NULL,
        funding_stage TEXT,
        location_city TEXT NOT NULL,
        location_district TEXT,
        stability_score REAL DEFAULT 50,
        promotion_clarity REAL DEFAULT 50,
        tags TEXT,
        description TEXT,
        source TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        ai_insights TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOT NULL
      );
    `,
    down: `
      DROP TABLE IF EXISTS assessments;
      DROP TABLE IF EXISTS companies;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS data_sources;
      DROP TABLE IF EXISTS settings;
    `,
  },
];

/**
 * 获取当前迁移版本
 */
export function getCurrentMigrationVersion(): number {
  return SCHEMA_VERSIONS.length > 0 ? SCHEMA_VERSIONS[SCHEMA_VERSIONS.length - 1].version : 0;
}
