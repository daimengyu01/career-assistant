/**
 * DeepSeek API 实现
 * 调用 https://api.deepseek.com/chat/completions
 */

import axios from 'axios';
import { AiProvider, AiMessage, AiResponse, AiStreamCallbacks, AiProviderConfig } from './AiProvider';

export interface DeepSeekMessage extends AiMessage {}

export interface DeepSeekChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepSeekChoice[];
  usage: DeepSeekUsage;
}

export interface DeepSeekStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class DeepSeekProvider extends AiProvider {
  private readonly baseURL = 'https://api.deepseek.com';
  private readonly defaultModel = 'deepseek-chat';

  constructor(config: AiProviderConfig) {
    super(config);
  }

  getProviderName(): string {
    return 'deepseek';
  }

  getSupportedModels(): string[] {
    return ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
  }

  private getModel(): string {
    return this.config.model ?? this.defaultModel;
  }

  async chat(messages: AiMessage[]): Promise<AiResponse> {
    try {
      const response = await axios.post<DeepSeekChatResponse>(
        `${this.baseURL}/chat/completions`,
        {
          model: this.getModel(),
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: this.config.timeout,
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message ?? error.message;
        throw new Error(`DeepSeek API 调用失败: ${message}`);
      }
      throw error;
    }
  }

  async chatStream(messages: AiMessage[], callbacks: AiStreamCallbacks): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.getModel(),
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: this.config.timeout,
          responseType: 'stream',
        },
      );

      const stream = response.data;
      let fullResponse = '';

      stream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line === 'data: [DONE]') {
            callbacks.onComplete?.(fullResponse);
            return;
          }

          if (line.startsWith('data: ')) {
            try {
              const parsed: DeepSeekStreamChunk = JSON.parse(line.slice(6));
              const token = parsed.choices[0]?.delta?.content;
              if (token) {
                fullResponse += token;
                callbacks.onToken(token);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      });

      stream.on('end', () => {
        callbacks.onComplete?.(fullResponse);
      });

      stream.on('error', (error: Error) => {
        callbacks.onError?.(error);
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message ?? error.message;
        callbacks.onError?.(new Error(`DeepSeek 流式调用失败: ${message}`));
        return;
      }
      callbacks.onError?.(error as Error);
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model: 'text-embedding-3-small',
          input: text,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: this.config.timeout,
        },
      );

      return response.data.data[0].embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message ?? error.message;
        throw new Error(`DeepSeek Embedding 调用失败: ${message}`);
      }
      throw error;
    }
  }
}
