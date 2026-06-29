/**
 * OpenAI API 实现
 * 调用 https://api.openai.com/v1/chat/completions
 */

import axios from 'axios';
import { AiProvider, AiMessage, AiResponse, AiStreamCallbacks, AiProviderConfig } from './AiProvider';

export interface OpenAIMessage extends AiMessage {}

export interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export interface OpenAIStreamChunk {
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

export class OpenAIProvider extends AiProvider {
  private readonly baseURL = 'https://api.openai.com';
  private readonly defaultModel = 'gpt-4o-mini';

  constructor(config: AiProviderConfig) {
    super(config);
  }

  getProviderName(): string {
    return 'openai';
  }

  getSupportedModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'];
  }

  private getModel(): string {
    return this.config.model ?? this.defaultModel;
  }

  async chat(messages: AiMessage[]): Promise<AiResponse> {
    try {
      const response = await axios.post<OpenAIChatResponse>(
        `${this.baseURL}/v1/chat/completions`,
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
        throw new Error(`OpenAI API 调用失败: ${message}`);
      }
      throw error;
    }
  }

  async chatStream(messages: AiMessage[], callbacks: AiStreamCallbacks): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
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
              const parsed: OpenAIStreamChunk = JSON.parse(line.slice(6));
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
        callbacks.onError?.(new Error(`OpenAI 流式调用失败: ${message}`));
        return;
      }
      callbacks.onError?.(error as Error);
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/embeddings`,
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
        throw new Error(`OpenAI Embedding 调用失败: ${message}`);
      }
      throw error;
    }
  }
}
