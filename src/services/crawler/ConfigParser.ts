/**
 * 爬虫配置解析器
 * 解析用户自定义数据源配置
 */

import type {
  ConfigParser,
  DataSourceType,
  DataSourceConfig,
  FieldMapping,
  PaginationConfig,
  RateLimitConfig,
  AuthConfig,
  ParsedConfig,
} from './types';

export interface ConfigParseError {
  field: string;
  message: string;
}

/**
 * JSON 配置解析器
 */
export class JsonConfigParser implements ConfigParser {
  name = 'json-config';
  version = '1.0.0';

  parse(config: Record<string, unknown>): ParsedConfig {
    const errors = this.validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`配置验证失败: ${errors.map((e) => e.message).join(', ')}`);
    }

    const source = this.parseDataSource(config.source as Record<string, unknown>);
    const mapping = this.parseFieldMapping(config.mapping as unknown[]);
    const pagination = config.pagination ? this.parsePagination(config.pagination as Record<string, unknown>) : undefined;
    const rateLimit = config.rateLimit ? this.parseRateLimit(config.rateLimit as Record<string, unknown>) : undefined;

    return { source, mapping, pagination, rateLimit };
  }

  validate(config: Record<string, unknown>): boolean {
    return this.validateConfig(config).length === 0;
  }

  private validateConfig(config: Record<string, unknown>): ConfigParseError[] {
    const errors: ConfigParseError[] = [];

    if (!config.source || typeof config.source !== 'object') {
      errors.push({ field: 'source', message: '缺少 source 配置对象' });
    } else {
      const source = config.source as Record<string, unknown>;
      if (!source.name || typeof source.name !== 'string') {
        errors.push({ field: 'source.name', message: 'source.name 必须为字符串' });
      }
      if (!source.type || !['api', 'script', 'file'].includes(source.type as string)) {
        errors.push({ field: 'source.type', message: 'source.type 必须为 api、script 或 file' });
      }
    }

    if (!config.mapping || !Array.isArray(config.mapping)) {
      errors.push({ field: 'mapping', message: '缺少 mapping 数组' });
    } else {
      const mapping = config.mapping as unknown[];
      mapping.forEach((item, index) => {
        const field = item as Record<string, unknown>;
        if (!field.source) {
          errors.push({ field: `mapping[${index}].source`, message: '缺少 source 字段' });
        }
        if (!field.target) {
          errors.push({ field: `mapping[${index}].target`, message: '缺少 target 字段' });
        }
      });
    }

    return errors;
  }

  private parseDataSource(source: Record<string, unknown>): DataSourceConfig {
    return {
      name: source.name as string,
      type: (source.type as DataSourceType) ?? 'file',
      endpoint: source.endpoint as string | undefined,
      method: (source.method as DataSourceConfig['method']) ?? 'GET',
      headers: (source.headers as Record<string, string>) ?? {},
      auth: source.auth ? this.parseAuth(source.auth as Record<string, unknown>) : undefined,
    };
  }

  private parseAuth(auth: Record<string, unknown>): AuthConfig {
    return {
      type: (auth.type as AuthConfig['type']) ?? 'bearer',
      token: auth.token as string | undefined,
      username: auth.username as string | undefined,
      password: auth.password as string | undefined,
      apiKey: auth.apiKey as string | undefined,
      apiKeyHeader: (auth.apiKeyHeader as string) ?? 'Authorization',
    };
  }

  private parseFieldMapping(mapping: unknown[]): FieldMapping[] {
    return mapping.map((item) => {
      const field = item as Record<string, unknown>;
      return {
        source: field.source as string,
        target: field.target as string,
        transform: field.transform as FieldMapping['transform'],
        options: field.options as Record<string, unknown> | undefined,
        defaultValue: field.defaultValue,
      };
    });
  }

  private parsePagination(pagination: Record<string, unknown>): PaginationConfig {
    return {
      type: (pagination.type as PaginationConfig['type']) ?? 'page',
      pageParam: pagination.pageParam as string | undefined,
      pageSize: Number(pagination.pageSize ?? 20),
      maxPages: Number(pagination.maxPages ?? 10),
    };
  }

  private parseRateLimit(rateLimit: Record<string, unknown>): RateLimitConfig {
    return {
      requestsPerSecond: Number(rateLimit.requestsPerSecond ?? 5),
      delayBetweenRequests: Number(rateLimit.delayBetweenRequests ?? 200),
      retryCount: Number(rateLimit.retryCount ?? 3),
      retryDelay: Number(rateLimit.retryDelay ?? 1000),
    };
  }
}

/**
 * 配置解析器注册表
 */
export class ConfigParserRegistry {
  private static parsers = new Map<string, ConfigParser>([
    ['json', new JsonConfigParser()],
  ]);

  static getParser(name: string): ConfigParser | undefined {
    return this.parsers.get(name);
  }

  static registerParser(name: string, parser: ConfigParser): void {
    this.parsers.set(name, parser);
  }
}

/**
 * 解析配置的工具函数
 */
export function parseConfig(config: Record<string, unknown>, format: string = 'json'): ParsedConfig {
  const parser = ConfigParserRegistry.getParser(format);
  if (!parser) {
    throw new Error(`不支持的配置格式: ${format}`);
  }
  return parser.parse(config);
}

/**
 * 验证配置的工具函数
 */
export function validateConfig(config: Record<string, unknown>, format: string = 'json'): boolean {
  const parser = ConfigParserRegistry.getParser(format);
  if (!parser) {
    throw new Error(`不支持的配置格式: ${format}`);
  }
  return parser.validate(config);
}
