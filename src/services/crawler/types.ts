/**
 * 爬虫相关类型定义
 */

/**
 * 数据源类型
 */
export type DataSourceType = 'api' | 'script' | 'file';

/**
 * 导入格式
 */
export type ImportFormat = 'json' | 'csv';

/**
 * 数据源配置
 */
export interface CrawlerDataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: Record<string, unknown>;
  createdAt: string;
  enabled: boolean;
}

/**
 * 抓取请求配置
 */
export interface CrawlRequest {
  sourceId: string;
  params?: Record<string, unknown>;
}

/**
 * 抓取结果
 */
export interface CrawlResult<T = unknown> {
  success: boolean;
  data: T[];
  total: number;
  errors?: string[];
  duration: number;
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  count: number;
  message?: string;
}

/**
 * 抓取策略接口
 */
export interface CrawlStrategy {
  name: string;
  description: string;
  supportedFormats: DataSourceType[];
  crawl(request: CrawlRequest): Promise<CrawlResult>;
  parse?(raw: unknown): unknown[];
  validate?(config: Record<string, unknown>): boolean;
}

/**
 * 配置解析器接口
 */
export interface ConfigParser {
  name: string;
  version: string;
  parse(config: Record<string, unknown>): ParsedConfig;
  validate(config: Record<string, unknown>): boolean;
}

/**
 * 解析后的配置
 */
export interface ParsedConfig {
  source: DataSourceConfig;
  mapping: FieldMapping[];
  pagination?: PaginationConfig;
  rateLimit?: RateLimitConfig;
}

/**
 * 数据源配置详情
 */
export interface DataSourceConfig {
  name: string;
  type: DataSourceType;
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  auth?: AuthConfig;
}

/**
 * 认证配置
 */
export interface AuthConfig {
  type: 'bearer' | 'basic' | 'apiKey' | 'cookie';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

/**
 * 字段映射
 */
export interface FieldMapping {
  source: string;
  target: string;
  transform?: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  options?: Record<string, unknown>;
  defaultValue?: unknown;
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  type: 'page' | 'offset' | 'cursor';
  pageParam?: string;
  pageSize?: number;
  maxPages?: number;
}

/**
 * 限流配置
 */
export interface RateLimitConfig {
  requestsPerSecond: number;
  delayBetweenRequests?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * 转换器配置
 */
export interface TransformConfig {
  type: 'rename' | 'cast' | 'map' | 'filter' | 'merge' | 'split';
  params: Record<string, unknown>;
}

/**
 * 爬虫引擎配置
 */
export interface CrawlerEngineConfig {
  defaultTimeout: number;
  defaultRetryCount: number;
  defaultRetryDelay: number;
  maxConcurrency: number;
}
