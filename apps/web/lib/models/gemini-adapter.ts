import { type ModelAdapter, ModelAdapterFactory } from "./model-adapter"
import type { ModelConfig, Message } from "@/types/chat"
import { generateText, streamText } from "ai"
import { google } from "@ai-sdk/google"

export class GeminiAdapter implements ModelAdapter {
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
    // Convert our app's Message type to the format expected by the AI SDK
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      content: msg.content,
    })) as any // Using any to bypass type checking for the AI SDK

    // Common options for both streaming and non-streaming
    const modelOptions: any = {
      model: google(this.config.modelName),
      messages: formattedMessages,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
    }

    // Add system instructions if provided
    if (systemMessage) {
      modelOptions.systemInstruction = systemMessage
    }

    if (options?.onChunk) {
      const stream = streamText({
        ...modelOptions,
        onChunk: ({ chunk }) => {
          if (chunk.type === "text-delta") {
            options.onChunk?.(chunk.textDelta)
          }
        },
      })

      return await stream.text
    } else {
      const response = await generateText(modelOptions)
      return response.text
    }
  }

  getName(): string {
    return this.config.modelName
  }

  getProvider(): string {
    return "google"
  }
}

// Register the adapter with the factory
ModelAdapterFactory.register("google", (config) => new GeminiAdapter(config))
