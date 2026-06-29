/**
 * 内置抓取策略
 * 提供常用的数据抓取和解析策略
 */

import type {
  CrawlStrategy,
  CrawlRequest,
  CrawlResult,
  DataSourceType,
} from './types';
import type { Company } from '../../types/company';

/**
 * JSON 文件导入策略
 */
export class JsonImportStrategy implements CrawlStrategy {
  name = 'json-import';
  description = '从 JSON 文件导入数据';
  supportedFormats: DataSourceType[] = ['file'];

  async crawl(request: CrawlRequest): Promise<CrawlResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 注意：在 Electron 环境中，实际文件读取通过 electronAPI 完成
      // 这里返回解析逻辑的接口定义
      const rawData = request.params?.rawData ?? request.params?.data;

      if (!rawData) {
        return {
          success: false,
          data: [],
          total: 0,
          errors: ['缺少 rawData 参数'],
          duration: Date.now() - startTime,
        };
      }

      const data = Array.isArray(rawData) ? rawData : [rawData];
      const parsed = this.parseData(data);

      return {
        success: true,
        data: parsed,
        total: parsed.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : '未知错误');
      return {
        success: false,
        data: [],
        total: 0,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  parse(raw: unknown): unknown[] {
    return this.parseData(raw as unknown[]);
  }

  private parseData(data: unknown[]): Company[] {
    return data.map((item, index) => {
      const record = item as Record<string, unknown>;
      return {
        id: (record.id as string) ?? `import-${Date.now()}-${index}`,
        name: (record.name as string) ?? (record.companyName as string) ?? `未知公司 ${index + 1}`,
        industry: (record.industry as string) ?? '其他',
        scale: this.normalizeScale(record.scale as string),
        fundingStage: record.fundingStage as string | undefined,
        location: {
          city: ((record.location as Record<string, unknown> | undefined)?.city as string) ?? (record.city as string) ?? '未知',
          district: (record.location as Record<string, unknown> | undefined)?.district as string | undefined ?? (record.district as string | undefined),
        },
        stabilityScore: Number(record.stabilityScore ?? record.stability ?? 50),
        promotionClarity: Number(record.promotionClarity ?? record.promotion ?? 50),
        tags: (record.tags as string[]) ?? [],
        description: record.description as string | undefined,
        source: 'json-import',
        createdAt: new Date().toISOString(),
      } satisfies Company;
    });
  }

  private normalizeScale(scale: string): Company['scale'] {
    const normalized = scale.toLowerCase();
    if (normalized.includes('startup') || normalized.includes('初创')) return 'startup';
    if (normalized.includes('medium') || normalized.includes('中型')) return 'medium';
    if (normalized.includes('large') || normalized.includes('大型')) return 'large';
    return 'startup';
  }

  validate(_config: Record<string, unknown>): boolean {
    return true;
  }
}

/**
 * CSV 文件导入策略
 */
export class CsvImportStrategy implements CrawlStrategy {
  name = 'csv-import';
  description = '从 CSV 文件导入数据';
  supportedFormats: DataSourceType[] = ['file'];

  async crawl(request: CrawlRequest): Promise<CrawlResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const rawData = request.params?.rawData ?? request.params?.data;
      const delimiter = (request.params?.delimiter as string) ?? ',';

      if (!rawData || typeof rawData !== 'string') {
        return {
          success: false,
          data: [],
          total: 0,
          errors: ['缺少 CSV 数据'],
          duration: Date.now() - startTime,
        };
      }

      const parsed = this.parseCsv(rawData, delimiter);
      const companies = this.mapToCompanies(parsed);

      return {
        success: true,
        data: companies,
        total: companies.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'CSV 解析失败');
      return {
        success: false,
        data: [],
        total: 0,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  parse(raw: unknown): unknown[] {
    if (typeof raw !== 'string') return [];
    const parsed = this.parseCsv(raw, ',');
    return this.mapToCompanies(parsed);
  }

  private parseCsv(csvText: string, delimiter: string): Record<string, string>[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = this.parseCsvLine(lines[0], delimiter);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = this.parseCsvLine(lines[i], delimiter);
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] ?? '';
      });
      records.push(record);
    }

    return records;
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private mapToCompanies(records: Record<string, string>[]): Company[] {
    return records.map((record, index) => {
      const nestedLocation = record.location as unknown as Record<string, string> | undefined;
      return {
        id: `csv-${Date.now()}-${index}`,
        name: record.name ?? record.companyName ?? `未知公司 ${index + 1}`,
        industry: record.industry ?? '其他',
        scale: this.normalizeScale(record.scale),
        fundingStage: record.fundingStage ?? undefined,
        location: {
          city: nestedLocation?.city ?? record.city ?? '未知',
          district: nestedLocation?.district ?? record.district ?? undefined,
        },
        stabilityScore: Number(record.stabilityScore ?? record.stability ?? 50),
        promotionClarity: Number(record.promotionClarity ?? record.promotion ?? 50),
        tags: record.tags ? record.tags.split(';').filter(Boolean) : [],
        description: record.description ?? undefined,
        source: 'csv-import',
        createdAt: new Date().toISOString(),
      } as Company;
    });
  }

  private normalizeScale(scale: string): Company['scale'] {
    const normalized = scale.toLowerCase();
    if (normalized.includes('startup') || normalized.includes('初创')) return 'startup';
    if (normalized.includes('medium') || normalized.includes('中型')) return 'medium';
    if (normalized.includes('large') || normalized.includes('大型')) return 'large';
    return 'startup';
  }

  validate(_config: Record<string, unknown>): boolean {
    return true;
  }
}

/**
 * API 调用策略
 */
export class ApiFetchStrategy implements CrawlStrategy {
  name = 'api-fetch';
  description = '通过 API 接口获取数据';
  supportedFormats: DataSourceType[] = ['api'];

  async crawl(request: CrawlRequest): Promise<CrawlResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const config = request.params?.config as Record<string, unknown>;
      const endpoint = config?.endpoint as string;

      if (!endpoint) {
        return {
          success: false,
          data: [],
          total: 0,
          errors: ['缺少 endpoint 参数'],
          duration: Date.now() - startTime,
        };
      }

      // 实际 API 调用通过 electronAPI 完成
      // 这里返回接口定义
      return {
        success: true,
        data: [],
        total: 0,
        errors: ['需要在主进程中执行实际 API 调用'],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'API 调用失败');
      return {
        success: false,
        data: [],
        total: 0,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  parse(_raw: unknown): unknown[] {
    return [];
  }

  validate(config: Record<string, unknown>): boolean {
    return !!(config.endpoint && typeof config.endpoint === 'string');
  }
}

/**
 * 内置策略注册表
 */
export class BuiltinStrategyRegistry {
  private static strategies = new Map<string, CrawlStrategy>([
    ['json-import', new JsonImportStrategy()],
    ['csv-import', new CsvImportStrategy()],
    ['api-fetch', new ApiFetchStrategy()],
  ]);

  static getStrategy(name: string): CrawlStrategy | undefined {
    return this.strategies.get(name);
  }

  static getAllStrategies(): CrawlStrategy[] {
    return Array.from(this.strategies.values());
  }

  static registerStrategy(name: string, strategy: CrawlStrategy): void {
    this.strategies.set(name, strategy);
  }
}
