import { ipcMain } from 'electron';
import Store from 'electron-store';
import { getEncryptionKey } from '../config';
import { getDb, persist } from '../db/index';

interface SearchSource {
  id: string;
  name: string;
  type: 'bing' | 'serpapi' | 'custom';
  config: {
    apiKey?: string;
    endpoint?: string;
    params?: Record<string, string>;
  };
}

interface Settings {
  searchSources: SearchSource[];
}

const store = new Store<Settings>({
  name: 'settings',
  encryptionKey: getEncryptionKey(),
});

function getEnabledSearchSource(): SearchSource | undefined {
  const sources = store.store.searchSources || [];
  return sources.find(s => s.config?.apiKey);
}

export function registerCrawlerHandlers() {
  ipcMain.handle('crawler:getSources', async () => {
    return store.store.searchSources || [];
  });

  ipcMain.handle('crawler:saveSource', async (_event, source: SearchSource) => {
    const sources = store.store.searchSources || [];
    const idx = sources.findIndex(s => s.id === source.id);
    if (idx >= 0) {
      sources[idx] = source;
    } else {
      sources.push(source);
    }
    store.store.searchSources = sources;
    store.save();
    return source;
  });

  ipcMain.handle('crawler:searchJobs', async (_event, query: string) => {
    const source = getEnabledSearchSource();
    if (!source) {
      throw new Error('未配置可用的搜索源');
    }

    if (source.type === 'bing') {
      return searchBing(source, query);
    }
    if (source.type === 'serpapi') {
      return searchSerpApi(source, query);
    }
    if (source.type === 'custom') {
      return searchCustom(source, query);
    }

    throw new Error(`不支持的搜索源类型: ${source.type}`);
  });

  // 导入 JSON/CSV 职位数据
  ipcMain.handle('crawler:import', async (_event, format: string, data: unknown) => {
    try {
      const db = getDb();
      let records: Array<Record<string, unknown>> = [];

      if (format === 'json') {
        // data 可能是 JSON 字符串或已解析的数组
        let parsed: unknown = data;
        if (typeof data === 'string') {
          parsed = JSON.parse(data);
        }
        if (!Array.isArray(parsed)) {
          throw new Error('JSON 数据必须是数组');
        }
        records = parsed as Array<Record<string, unknown>>;
      } else if (format === 'csv') {
        const text = typeof data === 'string' ? data : String(data);
        records = parseCsv(text);
      } else {
        throw new Error(`不支持的导入格式: ${format}`);
      }

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO job_listings
          (id, title, company, location_city, salary, source, source_url, description, collected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      const now = new Date().toISOString();
      for (const record of records) {
        stmt.run(
          record.id || `import-${Date.now()}-${count}`,
          record.title || record.name || '未知职位',
          record.company || '未知公司',
          record.location || record.location_city || null,
          record.salary || null,
          record.source || 'import',
          record.url || record.source_url || null,
          record.description || record.snippet || null,
          record.collectedAt || record.collected_at || now
        );
        count++;
      }
      persist();
      return { success: true, count };
    } catch (error) {
      console.error('crawler:import error:', error);
      throw error;
    }
  });

  // 批量保存搜索结果到 job_listings 表
  ipcMain.handle('crawler:saveJobs', async (_event, jobs: unknown[]) => {
    try {
      const db = getDb();
      const list = Array.isArray(jobs) ? jobs : [];
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO job_listings
          (id, title, company, location_city, salary, source, source_url, description, collected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      const now = new Date().toISOString();
      for (const job of list) {
        const record = (job || {}) as Record<string, unknown>;
        stmt.run(
          record.id || `job-${Date.now()}-${count}`,
          record.title || '未知职位',
          record.company || '未知公司',
          record.location || record.location_city || null,
          record.salary || null,
          record.source || 'search',
          record.url || record.source_url || null,
          record.description || record.snippet || null,
          record.collectedAt || record.collected_at || now
        );
        count++;
      }
      persist();
      return { success: true, count };
    } catch (error) {
      console.error('crawler:saveJobs error:', error);
      throw error;
    }
  });

  // 删除搜索源
  ipcMain.handle('crawler:deleteSource', async (_event, sourceId: string) => {
    try {
      const sources = store.store.searchSources || [];
      const filtered = sources.filter(s => s.id !== sourceId);
      store.set('searchSources', filtered);
      return { success: true };
    } catch (error) {
      console.error('crawler:deleteSource error:', error);
      throw error;
    }
  });

  // 运行网页爬虫
  ipcMain.handle(
    'crawler:runCrawler',
    async (
      _event,
      config: { url: string; maxPages?: number; selector?: string; interval?: number }
    ) => {
      try {
        const { url, maxPages = 1, selector, interval = 1000 } = config;
        if (!url) {
          throw new Error('未提供爬取起始 URL');
        }

        const userAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        const allJobs: Array<Record<string, unknown>> = [];
        let pages = 0;

        for (let page = 1; page <= maxPages; page++) {
          // 构造分页 URL：第 1 页使用原始 URL，后续页尝试追加 page 参数
          const pageUrl = page === 1 ? url : buildPageUrl(url, page);
          const response = await fetch(pageUrl, {
            headers: {
              'User-Agent': userAgent,
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'zh-CN,zh;q=0.9',
            },
          });
          if (!response.ok) {
            console.warn(`爬取第 ${page} 页失败: HTTP ${response.status}`);
            break;
          }
          const html = await response.text();
          const jobs = extractJobsFromHtml(html, pageUrl, selector);
          allJobs.push(...jobs);
          pages = page;

          if (page < maxPages && interval > 0) {
            await sleep(interval);
          }
        }

        // 提取结果写入 job_listings 表
        const db = getDb();
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO job_listings
            (id, title, company, location_city, salary, source, source_url, description, collected_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const now = new Date().toISOString();
        let count = 0;
        for (const job of allJobs) {
          stmt.run(
            job.id || `crawl-${Date.now()}-${count}`,
            job.title || '未知职位',
            job.company || '未知公司',
            job.location || null,
            job.salary || null,
            job.source || 'crawler',
            job.url || null,
            job.description || null,
            job.collectedAt || now
          );
          count++;
        }
        persist();

        return { success: true, count, pages };
      } catch (error) {
        console.error('crawler:runCrawler error:', error);
        throw error;
      }
    }
  );

  // 获取本地已保存的职位列表
  ipcMain.handle('crawler:getJobs', async () => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM job_listings ORDER BY collected_at DESC LIMIT 200');
      const rows = stmt.all();
      return rows;
    } catch (error) {
      console.error('crawler:getJobs error:', error);
      return [];
    }
  });
}

async function searchBing(source: SearchSource, query: string) {
  const apiKey = source.config.apiKey;
  const endpoint = source.config.endpoint || 'https://api.bing.microsoft.com/v7.0/search';
  const url = new URL(endpoint);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '10');
  url.searchParams.set('textDecorations', 'false');
  url.searchParams.set('mkt', 'zh-CN');

  const response = await fetch(url.toString(), {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey as string },
  });

  if (!response.ok) {
    throw new Error(`Bing 搜索失败: ${response.status}`);
  }

  const data = await response.json();
  const items = (data.webPages?.value || []).map((item: any, index: number) => ({
    id: `bing-${Date.now()}-${index}`,
    title: item.name,
    url: item.url,
    snippet: item.snippet,
    source: 'bing',
    collectedAt: new Date().toISOString(),
  }));

  return items;
}

async function searchSerpApi(source: SearchSource, query: string) {
  const apiKey = source.config.apiKey;
  const endpoint = source.config.endpoint || 'https://serpapi.com/search';
  const url = new URL(endpoint);
  url.searchParams.set('engine', 'google_jobs');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey as string);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`SerpApi 搜索失败: ${response.status}`);
  }

  const data = await response.json();
  const items = (data.jobs_results || []).map((item: any, index: number) => ({
    id: `serpapi-${Date.now()}-${index}`,
    title: item.title,
    company: item.company_name,
    location: item.location,
    url: item.link,
    snippet: item.description,
    source: 'serpapi',
    collectedAt: new Date().toISOString(),
  }));

  return items;
}

async function searchCustom(source: SearchSource, query: string) {
  const apiKey = source.config.apiKey;
  const endpoint = source.config.endpoint;
  if (!endpoint) {
    throw new Error('自定义搜索源未配置 endpoint');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`自定义搜索失败: ${response.status}`);
  }

  const data = await response.json();
  const items = (data.results || data.items || []).map((item: any, index: number) => ({
    id: `custom-${Date.now()}-${index}`,
    title: item.title || item.name,
    url: item.url || item.link,
    snippet: item.snippet || item.description,
    source: 'custom',
    collectedAt: new Date().toISOString(),
  }));

  return items;
}

/** 简单的延时工具 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 简单的 CSV 解析器，支持双引号包裹的字段 */
function parseCsv(text: string): Array<Record<string, unknown>> {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        current.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        current.push(field);
        field = '';
        if (current.length > 1 || (current.length === 1 && current[0] !== '')) {
          rows.push(current);
        }
        current = [];
      } else {
        field += char;
      }
    }
  }
  // 处理最后一行
  if (field !== '' || current.length > 0) {
    current.push(field);
    if (current.length > 1 || (current.length === 1 && current[0] !== '')) {
      rows.push(current);
    }
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  const records: Array<Record<string, unknown>> = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = row[c] ?? '';
    }
    records.push(record);
  }
  return records;
}

/** 为分页构造 URL，保留已有查询参数 */
function buildPageUrl(base: string, page: number): string {
  try {
    const u = new URL(base);
    u.searchParams.set('page', String(page));
    return u.toString();
  } catch {
    // 如果 base 不是合法 URL，退化为拼接
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}page=${page}`;
  }
}

/**
 * 用正则从 HTML 中提取职位信息。
 * 策略：抽取带 href 的 <a> 标签作为职位链接/标题，再用薪资正则与城市关键词补充信息。
 */
function extractJobsFromHtml(
  html: string,
  sourceUrl: string,
  _selector?: string
): Array<Record<string, unknown>> {
  const jobs: Array<Record<string, unknown>> = [];
  const now = new Date().toISOString();

  // 匹配 <a href="...">文本</a>
  const anchorRe = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  // 薪资正则：如 15-25k、15k-25k、1-2万、1万-2万、8000-12000
  const salaryRe = /(\d+(?:\.\d+)?\s*[kK万]?\s*[-~至]\s*\d+(?:\.\d+)?\s*[kK万]?|\d{4,6}\s*[-~至]\s*\d{4,6})/;
  // 常见城市
  const cities = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州', '西安',
    '重庆', '天津', '长沙', '青岛', '郑州', '宁波', '昆明', '合肥', '厦门', '大连',
    '济南', '哈尔滨', '沈阳', '福州', '无锡', '佛山', '东莞', '珠海',
  ];

  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = anchorRe.exec(html)) !== null) {
    const href = match[1];
    const rawText = match[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    if (!rawText || rawText.length < 2) continue;
    // 过滤明显非职位链接（如“首页”“登录”“更多”）
    if (/^(首页|登录|注册|更多|下一页|上一页|关于|联系|版权)$/.test(rawText)) continue;

    // 取链接周围 300 字符上下文，用于提取公司/薪资/城市
    const contextStart = Math.max(0, match.index - 300);
    const contextEnd = Math.min(html.length, match.index + rawText.length + 300);
    const context = html
      .slice(contextStart, contextEnd)
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ');

    const salaryMatch = context.match(salaryRe);
    const city = cities.find(c => context.includes(c));

    // 构造绝对链接
    let link = href;
    try {
      link = new URL(href, sourceUrl).toString();
    } catch {
      link = href;
    }

    jobs.push({
      id: `crawl-${Date.now()}-${index}`,
      title: rawText.slice(0, 120),
      company: extractCompany(context) || '未知公司',
      location: city || null,
      salary: salaryMatch ? salaryMatch[0].trim() : null,
      url: link,
      source: 'crawler',
      description: rawText,
      collectedAt: now,
    });
    index++;
  }

  return jobs;
}

/** 从上下文中粗略提取公司名：优先匹配“公司”关键字附近的文本 */
function extractCompany(context: string): string | null {
  const m = context.match(/([\u4e00-\u9fa5A-Za-z0-9·]{2,20}(?:科技|技术|集团|公司|有限|网络|信息|控股|股份))/);
  return m ? m[1] : null;
}
