/**
 * 爬虫核心引擎
 * 支持 JSON/CSV 导入、API 调用
 */

import type {
  CrawlRequest,
  CrawlResult,
  ImportResult,
  CrawlerDataSource,
  DataSourceType,
  CrawlStrategy,
} from './types';
import { BuiltinStrategyRegistry } from './BuiltinStrategies';
import { ConfigParserRegistry, validateConfig } from './ConfigParser';

export interface CrawlerEngineOptions {
  onProgress?: (progress: CrawlProgress) => void;
  onError?: (error: CrawlError) => void;
}

export interface CrawlProgress {
  current: number;
  total: number;
  sourceId: string;
  message: string;
}

export interface CrawlError {
  sourceId: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ImportDataOptions {
  format: 'json' | 'csv';
  data: unknown;
  sourceName?: string;
}

export class CrawlerEngine {
  private options: CrawlerEngineOptions;
  private strategies = new Map<string, CrawlStrategy>();

  constructor(options: CrawlerEngineOptions = {}) {
    this.options = options;

    // 注册内置策略
    BuiltinStrategyRegistry.getAllStrategies().forEach((strategy) => {
      this.strategies.set(strategy.name, strategy);
    });
  }

  /**
   * 注册自定义策略
   */
  registerStrategy(name: string, strategy: CrawlStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * 执行抓取任务
   */
  async crawl(request: CrawlRequest): Promise<CrawlResult> {
    const strategy = this.strategies.get(request.sourceId);

    if (!strategy) {
      return {
        success: false,
        data: [],
        total: 0,
        errors: [`未找到策略: ${request.sourceId}`],
        duration: 0,
      };
    }

    try {
      this.options.onProgress?.({
        current: 0,
        total: 1,
        sourceId: request.sourceId,
        message: '开始抓取...',
      });

      const result = await strategy.crawl(request);

      if (result.success) {
        this.options.onProgress?.({
          current: result.total,
          total: result.total,
          sourceId: request.sourceId,
          message: `抓取完成，共 ${result.total} 条数据`,
        });
      } else {
        result.errors?.forEach((error) => {
          this.options.onError?.({
            sourceId: request.sourceId,
            message: error,
          });
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '抓取过程发生未知错误';
      this.options.onError?.({
        sourceId: request.sourceId,
        message,
      });

      return {
        success: false,
        data: [],
        total: 0,
        errors: [message],
        duration: 0,
      };
    }
  }

  /**
   * 导入数据
   */
  async importData(options: ImportDataOptions): Promise<ImportResult> {
    try {
      let strategy: CrawlStrategy | undefined;

      if (options.format === 'json') {
        strategy = this.strategies.get('json-import');
      } else if (options.format === 'csv') {
        strategy = this.strategies.get('csv-import');
      }

      if (!strategy) {
        return {
          success: false,
          count: 0,
          message: `不支持的导入格式: ${options.format}`,
        };
      }

      const request: CrawlRequest = {
        sourceId: strategy.name,
        params: {
          rawData: options.data,
        },
      };

      const result = await this.crawl(request);

      if (result.success) {
        return {
          success: true,
          count: result.total,
          message: `成功导入 ${result.total} 条数据`,
        };
      }

      return {
        success: false,
        count: 0,
        message: result.errors?.join('; ') ?? '导入失败',
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        message: error instanceof Error ? error.message : '导入过程发生错误',
      };
    }
  }

  /**
   * 解析数据源配置
   */
  parseDataSourceConfig(config: Record<string, unknown>, format: string = 'json'): CrawlerDataSource | null {
    try {
      const parser = ConfigParserRegistry.getParser(format);
      if (!parser) {
        throw new Error(`不支持的配置格式: ${format}`);
      }

      const parsed = parser.parse(config);

      return {
        id: `source-${Date.now()}`,
        name: parsed.source.name,
        type: parsed.source.type,
        config: config as Record<string, unknown>,
        createdAt: new Date().toISOString(),
        enabled: true,
      };
    } catch {
      return null;
    }
  }

  /**
   * 验证数据源配置
   */
  validateDataSourceConfig(config: Record<string, unknown>, format: string = 'json'): boolean {
    try {
      return validateConfig(config, format);
    } catch {
      return false;
    }
  }

  /**
   * 获取可用策略列表
   */
  getAvailableStrategies(): Array<{ name: string; description: string; formats: DataSourceType[] }> {
    return Array.from(this.strategies.values()).map((strategy) => ({
      name: strategy.name,
      description: strategy.description,
      formats: strategy.supportedFormats,
    }));
  }
}

// 单例模式
export const crawlerEngine = new CrawlerEngine({
  onProgress: (progress) => {
    console.log(`[Crawler] ${progress.sourceId}: ${progress.current}/${progress.total} - ${progress.message}`);
  },
  onError: (error) => {
    console.error(`[Crawler Error] ${error.sourceId}: ${error.message}`, error.details);
  },
});
