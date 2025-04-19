import { type ModelAdapter, ModelAdapterFactory } from "./model-adapter"
import type { ModelConfig, Message } from "~/types/chat"
import { OpenAIResponseService } from "../ai/openai/responseService"

export class OpenAIAdapter implements ModelAdapter {
  private config: ModelConfig

  constructor(config: ModelConfig) {
    this.config = config
  }

  async generateResponse(
    messages: Message[],
    systemMessage?: string,
    options?: {
      temperature?: number
      maxTokens?: number
      onChunk?: (chunk: string) => void
    },
  ): Promise<string> {
    return OpenAIResponseService.createResponse(
      {
        messages,
        systemMessage,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? this.config.maxTokens,
        onChunk: options?.onChunk,
      }
    )
  }

  getName(): string {
    return this.config.modelName
  }

  getProvider(): string {
    return this.config.provider
  }
}

// Register the adapter with the factory
ModelAdapterFactory.register("openai", (config) => new OpenAIAdapter(config))
