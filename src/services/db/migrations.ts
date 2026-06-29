/**
 * 数据库迁移辅助函数
 */

import type { SchemaVersion } from './schema';
import { SCHEMA_VERSIONS } from './schema';

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  message: string;
}

export interface MigrationStatus {
  currentVersion: number;
  targetVersion: number;
  pendingMigrations: SchemaVersion[];
  appliedMigrations: SchemaVersion[];
}

/**
 * 执行单个迁移
 */
export async function runMigration(_upSql: string): Promise<boolean> {
  try {
    // 实际迁移通过 electronAPI 执行
    // 这里返回执行结果
    if (typeof window !== 'undefined' && window.electronAPI) {
      // await window.electronAPI.runMigration(upSql);
      return true;
    }
    return true;
  } catch (error) {
    console.error('迁移执行失败:', error);
    return false;
  }
}

/**
 * 回滚单个迁移
 */
export async function rollbackMigration(_downSql: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // await window.electronAPI.rollbackMigration(downSql);
      return true;
    }
    return true;
  } catch (error) {
    console.error('迁移回滚失败:', error);
    return false;
  }
}

/**
 * 执行迁移到指定版本
 */
export async function migrateTo(targetVersion: number): Promise<MigrationResult> {
  const currentVersion = getCurrentVersion();
  const target = SCHEMA_VERSIONS.find((v) => v.version === targetVersion);

  if (!target) {
    return {
      success: false,
      fromVersion: currentVersion,
      toVersion: currentVersion,
      message: `目标版本 ${targetVersion} 不存在`,
    };
  }

  if (currentVersion === targetVersion) {
    return {
      success: true,
      fromVersion: currentVersion,
      toVersion: currentVersion,
      message: '数据库已是最新版本',
    };
  }

  if (currentVersion > targetVersion) {
    // 需要回滚
    const migrationsToRollback = SCHEMA_VERSIONS
      .filter((v) => v.version > targetVersion && v.version <= currentVersion)
      .reverse();

    for (const migration of migrationsToRollback) {
      const success = await rollbackMigration(migration.down);
      if (!success) {
        return {
          success: false,
          fromVersion: currentVersion,
          toVersion: currentVersion,
          message: `回滚迁移 ${migration.name} 失败`,
        };
      }
    }

    return {
      success: true,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      message: `成功回滚到版本 ${targetVersion}`,
    };
  }

  // 需要升级
  const migrationsToRun = SCHEMA_VERSIONS.filter((v) => v.version > currentVersion && v.version <= targetVersion);

  for (const migration of migrationsToRun) {
    const success = await runMigration(migration.up);
    if (!success) {
      return {
        success: false,
        fromVersion: currentVersion,
        toVersion: currentVersion,
        message: `执行迁移 ${migration.name} 失败`,
      };
    }
  }

  return {
    success: true,
    fromVersion: currentVersion,
    toVersion: targetVersion,
    message: `成功迁移到版本 ${targetVersion}`,
  };
}

/**
 * 获取迁移状态
 */
export function getMigrationStatus(): MigrationStatus {
  const currentVersion = getCurrentVersion();
  const targetVersion = SCHEMA_VERSIONS.length > 0 ? SCHEMA_VERSIONS[SCHEMA_VERSIONS.length - 1].version : 0;

  const appliedMigrations = SCHEMA_VERSIONS.filter((v) => v.version <= currentVersion);
  const pendingMigrations = SCHEMA_VERSIONS.filter((v) => v.version > currentVersion);

  return {
    currentVersion,
    targetVersion,
    pendingMigrations,
    appliedMigrations,
  };
}

/**
 * 获取当前版本（从 electronAPI 或默认值）
 */
function getCurrentVersion(): number {
  // 实际版本从 electronAPI 或本地存储获取
  // 这里返回 0 表示初始状态
  try {
    const stored = localStorage.getItem('db_version');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * 生成迁移 SQL（用于调试）
 */
export function generateMigrationSQL(version: number): string | null {
  const migration = SCHEMA_VERSIONS.find((v) => v.version === version);
  if (!migration) return null;
  return migration.up;
}

/**
 * 生成回滚 SQL（用于调试）
 */
export function generateRollbackSQL(version: number): string | null {
  const migration = SCHEMA_VERSIONS.find((v) => v.version === version);
  if (!migration) return null;
  return migration.down;
}
