import { Message } from "~/types/chat";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  // dangerouslyAllowBrowser should not be true for server-side usage
});

export interface CreateResponseOptions {
  messages: Message[];
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string) => void;
}

export class OpenAIResponseService {
  /**
   * Generate a response from OpenAI based on the conversation history
   */
  static async createResponse(options: CreateResponseOptions): Promise<string> {
    const { 
      messages, 
      systemMessage = "", 
      temperature = 0.7, 
      maxTokens = 1000,
      onChunk
    } = options;

    try {
      // Prepare messages for the API
      const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage || "You are a helpful assistant." },
        ...messages.map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content
        }))
      ];

      // If onChunk is provided, use streaming
      if (onChunk) {
        let accumulatedResponse = "";
        
        // Call the OpenAI API with streaming
        const stream = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: apiMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            accumulatedResponse += content;
            onChunk(content);
          }
        }
        
        return accumulatedResponse;
      } else {
        // Use non-streaming API for regular calls
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: apiMessages,
          temperature,
          max_tokens: maxTokens,
        });

        return response.choices[0]?.message?.content || "";
      }
    } catch (error) {
      console.error("Error generating response from OpenAI:", error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Stream a response from OpenAI based on the conversation history
   */
  static streamResponse(
    options: CreateResponseOptions,
    onStreamUpdate: (content: string) => void,
    onError: (error: Error) => void
  ): () => void {
    const { 
      messages, 
      systemMessage = "", 
      temperature = 0.7, 
      maxTokens = 1000 
    } = options;

    let isCancelled = false;

    // Start streaming
    (async () => {
      try {
        // Prepare messages for the API
        const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemMessage || "You are a helpful assistant." },
          ...messages.map(msg => ({
            role: msg.role === "user" ? "user" as const : "assistant" as const,
            content: msg.content
          }))
        ];

        // Call the OpenAI API with streaming
        const stream = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: apiMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });

        let accumulatedResponse = "";

        for await (const chunk of stream) {
          if (isCancelled) break;
          
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            accumulatedResponse += content;
            onStreamUpdate(accumulatedResponse);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error streaming response from OpenAI:", error);
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    })();

    // Return a function to cancel the stream
    return () => {
      isCancelled = true;
    };
  }
}
