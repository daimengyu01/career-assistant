/**
 * 通用工具函数
 */

// ==================== 日期处理 ====================

/**
 * 计算年龄
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

// ==================== 数组操作 ====================

/**
 * 数组去重
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return Array.from(new Set(array));
  }
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**
 * 数组分组
 */
export function groupBy<T, K extends string>(
  array: T[],
  key: keyof T | ((item: T) => K),
): Record<K, T[]> {
  const getKey = typeof key === 'function' ? key : (item: T) => String(item[key]) as K;

  return array.reduce(
    (result, item) => {
      const groupKey = getKey(item);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * 打乱数组
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ==================== 防抖节流 ====================

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}

// ==================== 本地存储 ====================

/**
 * 安全存储到 localStorage
 */
export function safeLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota exceeded or other errors
  }
}

/**
 * 从 localStorage 安全读取
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// ==================== 业务工具 ====================

/**
 * 根据专业推荐行业
 */
export function recommendIndustriesByMajor(major: string): string[] {
  const majorMap: Record<string, string[]> = {
    '计算机': ['互联网', '软件开发', '人工智能'],
    '金融': ['金融', '投资', '银行'],
    '医学': ['医疗', '医药', '生物科技'],
    '法律': ['法律', '合规', '咨询'],
    '工程': ['制造业', '建筑工程', '能源'],
    '设计': ['互联网', '文创', '广告'],
    '市场': ['互联网', '快消', '广告'],
    '会计': ['金融', '会计', '审计'],
  };
  return majorMap[major] || ['综合'];
}

/**
 * 计算公司匹配分数
 */
export function calculateMatchScore(
  userProfile: {
    major?: string;
    personality?: { extroversion: number; openness: number };
    riskPreference?: string;
  },
  company: {
    industry: string;
    scale: string;
    stabilityScore: number;
    promotionClarity: number;
  },
): number {
  let score = 50;

  // 行业匹配（+20）
  const recommendedIndustries = userProfile.major ? recommendIndustriesByMajor(userProfile.major) : [];
  if (recommendedIndustries.includes(company.industry)) {
    score += 20;
  }

  // 稳定性匹配（+15）
  if (userProfile.riskPreference === 'conservative' && company.stabilityScore > 70) {
    score += 15;
  } else if (userProfile.riskPreference === 'aggressive' && company.stabilityScore < 50) {
    score += 15;
  } else {
    score += 7;
  }

  // 晋升清晰度（+10）
  score += Math.min(company.promotionClarity / 10, 10);

  // 公司规模偏好（+5）
  if (company.scale === 'large') score += 3;
  if (company.scale === 'startup') score += 5;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * 过滤公司列表
 */
export function filterCompanies<T extends { industry?: string; location?: { city?: string }; stabilityScore?: number }>(
  companies: T[],
  filters: {
    industry?: string;
    city?: string;
    minStabilityScore?: number;
  },
): T[] {
  return companies.filter((company) => {
    if (filters.industry && company.industry !== filters.industry) return false;
    if (filters.city && company.location?.city !== filters.city) return false;
    if (filters.minStabilityScore !== undefined && (company.stabilityScore ?? 0) < filters.minStabilityScore) return false;
    return true;
  });
}

// ==================== 字符串处理 ====================

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 截断文本
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 高亮关键词
 */
export function highlightText(text: string, keyword: string): string {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
