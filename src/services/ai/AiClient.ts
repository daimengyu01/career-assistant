/**
 * 统一 AI 调用入口
 * 根据配置选择 Provider，支持流式响应
 */

import type { AiProvider, AiMessage, AiResponse, AiStreamCallbacks, AiProviderConfig } from './AiProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { OpenAIProvider } from './OpenAIProvider';
import type { PromptTemplate } from './PromptTemplates';

export type AiProviderType = 'deepseek' | 'openai';

export interface AiClientConfig {
  provider: AiProviderType;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AiCompletionOptions {
  stream?: boolean;
  callbacks?: AiStreamCallbacks;
}

class AiClient {
  private provider: AiProvider | null = null;

  /**
   * 初始化 AI 客户端
   */
  initialize(config: AiClientConfig): void {
    const providerConfig: AiProviderConfig = {
      apiKey: config.apiKey,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      timeout: config.timeout,
    };

    switch (config.provider) {
      case 'deepseek':
        this.provider = new DeepSeekProvider(providerConfig);
        break;
      case 'openai':
        this.provider = new OpenAIProvider(providerConfig);
        break;
      default:
        throw new Error(`不支持的 AI Provider: ${config.provider}`);
    }
  }

  /**
   * 获取当前 Provider
   */
  getProvider(): AiProvider | null {
    return this.provider;
  }

  /**
   * 获取当前 Provider 名称
   */
  getProviderName(): string {
    return this.provider?.getProviderName() ?? 'unknown';
  }

  /**
   * 获取支持的模型列表
   */
  getSupportedModels(): string[] {
    return this.provider?.getSupportedModels() ?? [];
  }

  /**
   * 简单对话
   */
  async chat(message: string, options?: AiCompletionOptions): Promise<AiResponse> {
    if (!this.provider) {
      throw new Error('AI 客户端未初始化，请先调用 initialize()');
    }

    const messages: AiMessage[] = [
      { role: 'user', content: message },
    ];

    if (options?.stream) {
      return this.chatStream(messages, options.callbacks);
    }

    return this.provider.chat(messages);
  }

  /**
   * 多轮对话
   */
  async chatWithHistory(
    messages: AiMessage[],
    options?: AiCompletionOptions,
  ): Promise<AiResponse> {
    if (!this.provider) {
      throw new Error('AI 客户端未初始化，请先调用 initialize()');
    }

    if (options?.stream) {
      return this.chatStream(messages, options.callbacks);
    }

    return this.provider.chat(messages);
  }

  /**
   * 基于模板的对话
   */
  async chatWithTemplate(
    template: PromptTemplate,
    variables: Record<string, string>,
    systemContext?: string,
    options?: AiCompletionOptions,
  ): Promise<AiResponse> {
    if (!this.provider) {
      throw new Error('AI 客户端未初始化，请先调用 initialize()');
    }

    const { renderPrompt } = await import('./PromptTemplates');
    const userPrompt = renderPrompt(template, variables);

    const messages: AiMessage[] = [
      { role: 'system', content: systemContext ?? template.systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    if (options?.stream) {
      return this.chatStream(messages, options.callbacks);
    }

    return this.provider.chat(messages);
  }

  /**
   * 文本向量嵌入
   */
  async embed(text: string): Promise<number[]> {
    if (!this.provider) {
      throw new Error('AI 客户端未初始化，请先调用 initialize()');
    }
    return this.provider.embed(text);
  }

  /**
   * 流式对话（内部实现）
   */
  private async chatStream(
    messages: AiMessage[],
    callbacks?: AiStreamCallbacks,
  ): Promise<AiResponse> {
    if (!this.provider) {
      throw new Error('AI 客户端未初始化');
    }

    let fullContent = '';

    await this.provider.chatStream(messages, {
      onToken: (token) => {
        fullContent += token;
        callbacks?.onToken(token);
      },
      onComplete: (response) => {
        callbacks?.onComplete?.(response);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
    });

    return {
      content: fullContent,
      finishReason: 'stop',
    };
  }
}

// 单例模式
export const aiClient = new AiClient();
