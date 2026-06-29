import { ipcMain } from 'electron';
import Store from 'electron-store';
import { getEncryptionKey } from '../config';

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
