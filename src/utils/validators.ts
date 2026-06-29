/**
 * 表单验证函数
 * 使用 zod 进行类型安全验证
 */

import { z } from 'zod';

// ==================== 用户相关验证 ====================

export const UserProfileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
  age: z.coerce.number().int().min(16, '年龄不能小于16岁').max(100, '年龄不能大于100岁'),
  major: z.string().min(1, '专业不能为空').max(100, '专业名称不能超过100个字符'),
  education: z.string().optional(),
  graduationYear: z.coerce.number().int().min(1950, '毕业年份不能早于1950年').max(new Date().getFullYear() + 10, '毕业年份无效').optional(),
  personality: z.object({
    mbti: z.string().regex(/^[IE][SN][TF][JP]$/, '无效的 MBTI 类型').optional(),
    extroversion: z.number().min(0).max(100).optional(),
    openness: z.number().min(0).max(100).optional(),
    conscientiousness: z.number().min(0).max(100).optional(),
    agreeableness: z.number().min(0).max(100).optional(),
    neuroticism: z.number().min(0).max(100).optional(),
  }).optional(),
  interests: z.array(z.string().min(1)).max(20, '兴趣不能超过20个').optional(),
  careerGoals: z.string().max(500, '职业目标不能超过500个字符').optional(),
  riskPreference: z.enum(['conservative', 'balanced', 'aggressive']).optional(),
});

export type UserProfileFormData = z.infer<typeof UserProfileSchema>;

// ==================== 公司相关验证 ====================

export const CompanySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, '公司名称不能为空').max(100, '公司名称不能超过100个字符'),
  industry: z.string().min(1, '行业不能为空'),
  scale: z.enum(['startup', 'medium', 'large'], {
    errorMap: () => ({ message: '请选择公司规模' }),
  }),
  fundingStage: z.string().optional(),
  location: z.object({
    city: z.string().min(1, '城市不能为空'),
    district: z.string().optional(),
  }),
  stabilityScore: z.coerce.number().min(0).max(100).optional(),
  promotionClarity: z.coerce.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(1000).optional(),
  source: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof CompanySchema>;

export const CompanyFiltersSchema = z.object({
  industry: z.string().optional(),
  city: z.string().optional(),
  minStabilityScore: z.coerce.number().min(0).max(100).optional(),
});

export type CompanyFiltersFormData = z.infer<typeof CompanyFiltersSchema>;

// ==================== 测评相关验证 ====================

export const AssessmentResultSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  type: z.enum(['personality', 'interest', 'career_match']),
  data: z.record(z.unknown()),
  aiInsights: z.string().optional(),
});

export type AssessmentResultFormData = z.infer<typeof AssessmentResultSchema>;

// ==================== 爬虫相关验证 ====================

export const DataSourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '数据源名称不能为空').max(100, '数据源名称不能超过100个字符'),
  type: z.enum(['api', 'script', 'file'], {
    errorMap: () => ({ message: '请选择数据源类型' }),
  }),
  config: z.record(z.unknown()),
  enabled: z.boolean().optional(),
});

export type DataSourceFormData = z.infer<typeof DataSourceSchema>;

export const ImportRequestSchema = z.object({
  format: z.enum(['json', 'csv'], {
    errorMap: () => ({ message: '请选择导入格式' }),
  }),
  data: z.unknown(),
  sourceName: z.string().max(100).optional(),
});

export type ImportRequestFormData = z.infer<typeof ImportRequestSchema>;

// ==================== AI 相关验证 ====================

export const AiClientConfigSchema = z.object({
  provider: z.enum(['deepseek', 'openai'], {
    errorMap: () => ({ message: '请选择 AI Provider' }),
  }),
  apiKey: z.string().min(1, 'API Key 不能为空').max(200, 'API Key 长度无效'),
  model: z.string().optional(),
  maxTokens: z.coerce.number().int().positive().max(128000).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  timeout: z.coerce.number().positive().max(300000).optional(),
});

export type AiClientConfigFormData = z.infer<typeof AiClientConfigSchema>;

// ==================== 通用验证 ====================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationFormData = z.infer<typeof PaginationSchema>;

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证文件大小
 */
export function isValidFileSize(size: number, maxSizeMB = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}

/**
 * 验证文件类型
 */
export function isValidFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * 验证评分范围
 */
export function isValidScore(score: number, min = 0, max = 100): boolean {
  return Number.isFinite(score) && score >= min && score <= max;
}

/**
 * 验证 MBTI 类型
 */
export function isValidMBTI(type: string): boolean {
  return /^[IE][SN][TF][JP]$/.test(type.toUpperCase());
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T = unknown>(json: string, fallback?: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return (fallback as T) ?? ({} as T);
  }
}

/**
 * 验证对象是否为空
 */
export function isEmptyObject(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  return Object.keys(obj).length === 0;
}
