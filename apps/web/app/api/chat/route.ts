import { NextResponse } from "next/server"
import { ModelAdapterFactory } from "~/lib/models"
import type { ModelConfig, Message } from "~/types/chat"

export async function POST(request: Request) {
  try {
    const { messages, systemMessage, modelConfig } = await request.json()

    if (!messages || !Array.isArray(messages) || !modelConfig) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const modelAdapter = ModelAdapterFactory.create(modelConfig as ModelConfig)

    const response = await modelAdapter.generateResponse(messages as Message[], systemMessage)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error generating chat response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
