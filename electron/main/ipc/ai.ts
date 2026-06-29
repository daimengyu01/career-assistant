import { ipcMain } from 'electron';
import Store from 'electron-store';
import { getEncryptionKey } from '../config';
import axios from 'axios';

interface Settings {
  apiKeys: Record<string, string>;
  aiProvider: string;
  aiModel: string;
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

// DeepSeek API 调用
async function callDeepSeek(apiKey: string, model: string, messages: AiMessage[]): Promise<AiResponse> {
  const response = await axios.post(
    'https://api.deepseek.com/chat/completions',
    {
      model: model || 'deepseek-chat',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
      stream: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 60000,
    },
  );

  const choice = response.data.choices[0];
  return {
    content: choice.message.content,
    usage: {
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      totalTokens: response.data.usage.total_tokens,
    },
    finishReason: choice.finish_reason,
  };
}

// OpenAI API 调用
async function callOpenAI(apiKey: string, model: string, messages: AiMessage[]): Promise<AiResponse> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model || 'gpt-4o-mini',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
      stream: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 60000,
    },
  );

  const choice = response.data.choices[0];
  return {
    content: choice.message.content,
    usage: {
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      totalTokens: response.data.usage.total_tokens,
    },
    finishReason: choice.finish_reason,
  };
}

export function registerAiHandlers() {
  ipcMain.handle('ai:chat', async (_event, messages: Array<{ role: string; content: string }>) => {
    try {
      const settings = store.store;
      const provider = settings.aiProvider || 'deepseek';
      const apiKey = settings.apiKeys?.[provider];

      if (!apiKey) {
        throw new Error(`未配置 ${provider} 的 API Key，请在设置中配置`);
      }

      const aiMessages: AiMessage[] = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

      let response: AiResponse;

      switch (provider) {
        case 'deepseek':
          response = await callDeepSeek(apiKey, settings.aiModel, aiMessages);
          break;
        case 'openai':
          response = await callOpenAI(apiKey, settings.aiModel, aiMessages);
          break;
        default:
          throw new Error(`不支持的 AI Provider: ${provider}`);
      }

      return response.content;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  });

  ipcMain.handle('ai:getProviders', async () => {
    return ['deepseek', 'openai'];
  });

  ipcMain.handle('ai:getModels', async (_event, provider: string) => {
    const models: Record<string, string[]> = {
      deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    };
    return models[provider] || [];
  });
}
