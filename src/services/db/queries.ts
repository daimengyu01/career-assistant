/**
 * 前端数据库查询封装
 * 通过 electronAPI 与主进程通信
 */

import type { UserProfile } from '../../types/user';
import type { Company, CompanyFilters } from '../../types/company';
import type { AssessmentResult } from '../../types/assessment';
import type { DataSource } from '../../types/crawler';

export interface DbQueryFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 数据库查询封装类
 */
export class DbQueries {
  /**
   * 检查 electronAPI 是否可用
   */
  private static checkApi(): boolean {
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.warn('electronAPI 不可用，请确保在 Electron 环境中运行');
      return false;
    }
    return true;
  }

  // ==================== User 相关 ====================

  /**
   * 保存用户信息
   */
  static async saveUser(user: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const now = new Date().toISOString();
    const data = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };

    const result = await window.electronAPI!.saveAssessment(data);
    return result as UserProfile;
  }

  /**
   * 更新用户信息
   */
  static async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const user = await this.getUser(id);
    if (!user) return null;

    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const result = await window.electronAPI!.saveAssessment(updated);
    return result as UserProfile;
  }

  /**
   * 获取用户信息
   */
  static async getUser(id: string): Promise<UserProfile | null> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const assessments = await window.electronAPI!.getAssessments();
    const users = assessments as UserProfile[];
    return users.find((u) => u.id === id) ?? null;
  }

  /**
   * 获取所有用户
   */
  static async getAllUsers(filters?: DbQueryFilters): Promise<PaginatedResult<UserProfile>> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const assessments = await window.electronAPI!.getAssessments();
    const users = (assessments as UserProfile[]).filter((a) => a.personality);

    return this.paginate(users, filters);
  }

  // ==================== Company 相关 ====================

  /**
   * 保存公司信息
   */
  static async saveCompany(company: Omit<Company, 'createdAt'>): Promise<Company> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const data = {
      ...company,
      createdAt: new Date().toISOString(),
    };

    const result = await window.electronAPI!.saveCompany(data);
    return result as Company;
  }

  /**
   * 批量保存公司
   */
  static async saveCompanies(companies: Omit<Company, 'createdAt'>[]): Promise<Company[]> {
    const results = await Promise.allSettled(
      companies.map((company) => this.saveCompany(company)),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<Company> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  /**
   * 获取公司信息
   */
  static async getCompany(id: string): Promise<Company | null> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const result = await window.electronAPI!.getCompany(id);
    return result as Company | null;
  }

  /**
   * 获取所有公司
   */
  static async getCompanies(filters?: CompanyFilters): Promise<Company[]> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const result = await window.electronAPI!.getCompanies(filters);
    return result as Company[];
  }

  /**
   * 删除公司
   */
  static async deleteCompany(id: string): Promise<void> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    await window.electronAPI!.deleteCompany(id);
  }

  /**
   * 分页查询公司
   */
  static async getCompaniesPaginated(
    filters?: CompanyFilters & DbQueryFilters,
  ): Promise<PaginatedResult<Company>> {
    const companies = await this.getCompanies(filters);
    return this.paginate(companies, filters);
  }

  // ==================== Assessment 相关 ====================

  /**
   * 保存测评结果
   */
  static async saveAssessment(result: Omit<AssessmentResult, 'createdAt'>): Promise<AssessmentResult> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const data = {
      ...result,
      createdAt: new Date().toISOString(),
    };

    const response = await window.electronAPI!.saveAssessment(data);
    return response as AssessmentResult;
  }

  /**
   * 获取所有测评结果
   */
  static async getAssessments(): Promise<AssessmentResult[]> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const result = await window.electronAPI!.getAssessments();
    return result as AssessmentResult[];
  }

  // ==================== DataSource 相关 ====================

  /**
   * 保存数据源
   */
  static async saveDataSource(config: Omit<DataSource, 'createdAt'>): Promise<DataSource> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const data = {
      ...config,
      createdAt: new Date().toISOString(),
    };

    await window.electronAPI!.saveDataSource(data);
    return data as DataSource;
  }

  /**
   * 获取所有数据源
   */
  static async getDataSources(): Promise<DataSource[]> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const result = await window.electronAPI!.getDataSources();
    return result as DataSource[];
  }

  // ==================== Settings 相关 ====================

  /**
   * 获取设置
   */
  static async getSettings(): Promise<Record<string, unknown>> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    const result = await window.electronAPI!.getSettings();
    return result as Record<string, unknown>;
  }

  /**
   * 保存设置
   */
  static async saveSettings(settings: Record<string, unknown>): Promise<void> {
    if (!this.checkApi()) throw new Error('electronAPI 不可用');

    await window.electronAPI!.saveSettings(settings);
  }

  // ==================== 工具方法 ====================

  /**
   * 分页处理
   */
  private static paginate<T>(data: T[], filters?: DbQueryFilters): PaginatedResult<T> {
    const pageSize = filters?.limit ?? 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;
    const start = filters?.offset ?? 0;
    const end = start + pageSize;

    const paginatedData = data.slice(start, end);

    return {
      data: paginatedData,
      total: data.length,
      page,
      pageSize,
      totalPages: Math.ceil(data.length / pageSize),
    };
  }
}
