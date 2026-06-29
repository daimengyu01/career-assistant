/**
 * AI Provider 抽象基类
 * 定义统一的 AI 调用接口，支持多 Provider 扩展
 */

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface AiStreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface AiProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * AI Provider 抽象基类
 * 所有 Provider 实现必须实现 chat() 和 embed() 方法
 */
export abstract class AiProvider {
  protected config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = {
      maxTokens: config.maxTokens ?? 2048,
      temperature: config.temperature ?? 0.7,
      timeout: config.timeout ?? 60000,
      ...config,
    };
  }

  /**
   * 非流式对话调用
   */
  abstract chat(messages: AiMessage[]): Promise<AiResponse>;

  /**
   * 流式对话调用
   */
  abstract chatStream(
    messages: AiMessage[],
    callbacks: AiStreamCallbacks,
  ): Promise<void>;

  /**
   * 文本向量嵌入
   */
  abstract embed(text: string): Promise<number[]>;

  /**
   * 获取 Provider 名称
   */
  abstract getProviderName(): string;

  /**
   * 获取支持的模型列表
   */
  abstract getSupportedModels(): string[];
}
