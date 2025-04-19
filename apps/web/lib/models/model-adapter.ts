import type { ModelConfig, Message } from "@/types/chat"

export interface ModelAdapter {
  generateResponse: (
    messages: Message[],
    systemMessage?: string,
    options?: {
      temperature?: number
      maxTokens?: number
      onChunk?: (chunk: string) => void
    },
  ) => Promise<string>

  getName: () => string
  getProvider: () => string
}

export class ModelAdapterFactory {
  private static adapters: Record<string, (config: ModelConfig) => ModelAdapter> = {}

  static register(provider: string, factory: (config: ModelConfig) => ModelAdapter): void {
    this.adapters[provider] = factory
  }

  static create(config: ModelConfig): ModelAdapter {
    const factory = this.adapters[config.provider]

    if (!factory) {
      throw new Error(`No adapter registered for provider: ${config.provider}`)
    }

    return factory(config)
  }
}

