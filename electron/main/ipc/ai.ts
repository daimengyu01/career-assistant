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
}

interface Settings {
  aiProviders: AiProviderRecord[];
  activeProviderId?: string;
  prompts: Record<string, string>;
}

const store = new Store<Settings>({
  name: 'settings',
  encryptionKey: getEncryptionKey(),
});

interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

function getActiveProvider(): AiProviderRecord {
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

async function callChatCompletions(provider: AiProviderRecord, messages: AiMessage[]): Promise<AiResponse> {
  const url = `${provider.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const response = await axios.post(
    url,
    {
      model: provider.model,
      messages,
      max_tokens: 2048,
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

  const choice = response.data.choices[0];
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
      console.error('AI chat error:', error);
      throw error;
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
    const messages: AiMessage[] = [
      { role: 'user', content: '请只回复：验证成功' },
    ];
    const response = await callChatCompletions(provider, messages);
    return {
      success: true,
      content: response.content,
    };
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
          apiKey: provider.apiKey,
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
