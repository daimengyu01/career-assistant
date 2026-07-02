import { ipcMain } from 'electron';
import Store from 'electron-store';
import { getEncryptionKey } from '../config';
import axios from 'axios';

interface AiProviderRecord {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isDefault?: boolean;
  supportsVision?: boolean;
}

interface Settings {
  aiProviders: AiProviderRecord[];
  activeProviderId?: string;
  visionProviderId?: string;
  prompts: Record<string, string>;
}

const store = new Store<Settings>({
  name: 'settings',
  encryptionKey: getEncryptionKey(),
});

interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  // 兼容 vision 消息格式：content 可以是纯文本，也可以是包含 text 和 image_url 的数组（OpenAI vision 格式）
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

interface AiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// SSRF 防护：拦截内网/本地地址
function isPrivateUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return true;
    const h = u.hostname;
    if (h === 'localhost' || h.startsWith('127.') || h.startsWith('10.') ||
        h.startsWith('192.168.') || h.startsWith('169.254.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '0.0.0.0') return true;
    return false;
  } catch { return true; }
}

// 脱敏 axios 错误：移除可能含敏感信息（apiKey、headers）的 config/request
function sanitizeAxiosError(error: any): Error {
  const safe = { ...error };
  if (safe.config) { delete safe.config; }
  if (safe.response?.config) { delete safe.response.config; }
  if (safe.request) { delete safe.request; }
  console.error('AI error:', safe.message || error);
  return new Error(safe.message || 'AI 调用失败');
}

export function getActiveProvider(): AiProviderRecord {
  const settings = store.store;
  const providers = settings.aiProviders || [];
  if (!providers.length) {
    throw new Error('尚未配置 AI 服务商，请先在设置中添加');
  }
  const active = providers.find(p => p.id === settings.activeProviderId) || providers[0];
  if (!active.apiKey) {
    throw new Error(`[${active.name}] 未配置 API Key`);
  }
  return active;
}

// 获取视觉模型供应商：优先 visionProviderId 指定的，回退到 supportsVision=true 的，最后回退到 activeProvider
export function getVisionProvider(): AiProviderRecord {
  const settings = store.store;
  const providers = settings.aiProviders || [];
  if (!providers.length) {
    throw new Error('尚未配置 AI 服务商，请先在设置中添加');
  }
  // 优先用 visionProviderId 指定的供应商
  const visionId = settings.visionProviderId;
  if (visionId) {
    const vp = providers.find(p => p.id === visionId);
    if (vp) {
      if (!vp.apiKey) throw new Error(`[${vp.name}] 未配置 API Key`);
      return vp;
    }
  }
  // 回退：找第一个 supportsVision=true 的
  const visionCapable = providers.find(p => p.supportsVision && p.apiKey);
  if (visionCapable) return visionCapable;
  // 再回退到 activeProvider
  const active = providers.find(p => p.id === settings.activeProviderId) || providers[0];
  if (!active.apiKey) {
    throw new Error(`[${active.name}] 未配置 API Key`);
  }
  return active;
}

export async function callChatCompletions(provider: AiProviderRecord, messages: AiMessage[]): Promise<AiResponse> {
  // 智能拼接 URL：
  // - 已含 /chat/completions 直接用
  // - 以数字结尾（/v1 /v4 /v2）视为已含版本号，追加 /chat/completions
  // - 否则追加 /v1/chat/completions
  const base = provider.baseUrl.replace(/\/+$/, '');
  const url = base.endsWith('/chat/completions')
    ? base
    : /\d$/.test(base)
      ? `${base}/chat/completions`
      : `${base}/v1/chat/completions`;
  const response = await axios.post(
    url,
    {
      model: provider.model,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
      stream: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      timeout: 60000,
    },
  );

  const choice = response.data?.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error(`AI 响应异常: HTTP ${response.status}, body=${JSON.stringify(response.data).slice(0, 200)}`);
  }
  return {
    content: choice.message.content,
    usage: response.data.usage
      ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        }
      : undefined,
    finishReason: choice.finish_reason,
  };
}

export function registerAiHandlers() {
  ipcMain.handle('ai:chat', async (_event, messages: Array<{ role: string; content: string }>) => {
    try {
      const provider = getActiveProvider();
      const aiMessages: AiMessage[] = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));
      const response = await callChatCompletions(provider, aiMessages);
      return response.content;
    } catch (error) {
      throw sanitizeAxiosError(error);
    }
  });

  ipcMain.handle('ai:getProviders', async () => {
    const settings = store.store;
    return (settings.aiProviders || []).map(p => ({ id: p.id, name: p.name, model: p.model, baseUrl: p.baseUrl }));
  });

  ipcMain.handle('ai:getModels', async () => {
    const provider = getActiveProvider();
    return [provider.model];
  });

  ipcMain.handle('ai:verifyProvider', async (_event, provider: AiProviderRecord) => {
    try {
      if (isPrivateUrl(provider.baseUrl)) {
        return { success: false, content: '不允许的 baseUrl（内网地址被禁止）' };
      }
      const messages: AiMessage[] = [
        { role: 'user', content: '请用一句话介绍你自己（10字内）' },
      ];
      const response = await callChatCompletions(provider, messages);
      return {
        success: true,
        content: response.content,
        model: provider.model,
      };
    } catch (error) {
      throw sanitizeAxiosError(error);
    }
  });

  // 保存 providers 数组和 activeProviderId 到 store
  ipcMain.handle(
    'ai:saveProviders',
    async (_event, providers: AiProviderRecord[], activeProviderId: string) => {
      try {
        const list = Array.isArray(providers) ? providers : [];
        store.set({ aiProviders: list, activeProviderId });
        return { success: true, count: list.length };
      } catch (error) {
        console.error('ai:saveProviders error:', error);
        throw error;
      }
    }
  );

  // 返回当前活跃 provider（含 apiKey，供前端显示）
  ipcMain.handle('ai:getActiveProvider', async () => {
    try {
      const provider = getActiveProvider();
      return {
        success: true,
        provider: {
          id: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey ? `${provider.apiKey.slice(0, 4)}****${provider.apiKey.slice(-4)}` : '',
          model: provider.model,
          isDefault: provider.isDefault ?? false,
        },
      };
    } catch (error) {
      console.error('ai:getActiveProvider error:', error);
      throw error;
    }
  });
}
