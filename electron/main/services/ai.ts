/**
 * AI 服务封装
 * 支持多服务商：DeepSeek、OpenAI、自定义 API
 */

export interface AiProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatOptions {
  messages: AiMessage[];
  provider?: AiProviderConfig;
  temperature?: number;
  maxTokens?: number;
}

export class AiService {
  private defaultProvider: AiProviderConfig = {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat',
  };

  setDefaultProvider(provider: AiProviderConfig) {
    this.defaultProvider = provider;
  }

  getDefaultProvider(): AiProviderConfig {
    return this.defaultProvider;
  }

  async chat(options: AiChatOptions): Promise<string> {
    const provider = options.provider || this.defaultProvider;
    
    if (!provider.apiKey) {
      throw new Error('未配置 API Key，请在设置中配置');
    }

    const url = `${provider.baseUrl}/v1/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI 请求失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async streamChat(options: AiChatOptions, onChunk: (chunk: string) => void): Promise<void> {
    const provider = options.provider || this.defaultProvider;
    
    if (!provider.apiKey) {
      throw new Error('未配置 API Key，请在设置中配置');
    }

    const url = `${provider.baseUrl}/v1/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI 请求失败: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            if (content) {
              onChunk(content);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

export const aiService = new AiService();
