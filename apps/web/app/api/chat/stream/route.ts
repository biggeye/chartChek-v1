import { NextResponse } from "next/server"
import { ModelAdapterFactory } from "~/lib/models"
import type { ModelConfig, Message } from "~/types/chat"

export async function POST(request: Request) {
  try {
    const { messages, systemMessage, modelConfig } = await request.json()
console.log('chat/stream API] modelConfig: ', modelConfig);
    if (!messages || !Array.isArray(messages) || !modelConfig) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const modelAdapter = ModelAdapterFactory.create(modelConfig as ModelConfig)

    // Create a TransformStream
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Start generating the response
    modelAdapter
      .generateResponse(messages as Message[], systemMessage, {
        onChunk: async (chunk: string) => {
          await writer.write(new TextEncoder().encode(chunk))
        },
      })
      .then(async () => {
        await writer.close()
      })
      .catch(async (error: Error) => {
        console.error("Error in stream:", error)
        await writer.abort(error)
      })

    // Return a streaming response
    return new Response(readable)
  } catch (error) {
    console.error("Error setting up streaming response:", error)
    return NextResponse.json({ error: "Failed to set up streaming response" }, { status: 500 })
  }
}
