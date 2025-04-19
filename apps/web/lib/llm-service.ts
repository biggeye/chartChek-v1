import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import type { Patient, PatientRecord, Document, QueueItem } from "~/types/store/chat/globalChat"

// LLM Models
export type LLMProvider = "openai" | "anthropic" | "google" | "assistants"
export type LLMModel =
  | "gpt-4o"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku"
  | "tjc"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "gemini-2.0-flash-001"
  | "gemini-2.5-pro-exp-03-25"

export interface LLMOption {
  id: string
  provider: LLMProvider
  model: LLMModel
  name: string
  description: string
  maxTokens: number
  costPer1KTokens: string
}

export const LLM_OPTIONS: LLMOption[] = [
  {
    id: "gpt-4o",
    provider: "openai",
    model: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable OpenAI model with vision",
    maxTokens: 128000,
    costPer1KTokens: "$0.0100",
  },
  {
    id: "gpt-4-turbo",
    provider: "openai",
    model: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Powerful model with knowledge up to Apr 2023",
    maxTokens: 128000,
    costPer1KTokens: "$0.0100",
  },
  {
    id: "gpt-3.5-turbo",
    provider: "openai",
    model: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective model",
    maxTokens: 16000,
    costPer1KTokens: "$0.0015",
  },
  {
    id: "claude-3-opus",
    provider: "anthropic",
    model: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Most powerful Claude model for complex tasks",
    maxTokens: 200000,
    costPer1KTokens: "$0.0150",
  },
  {
    id: "claude-3-sonnet",
    provider: "anthropic",
    model: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "Balanced performance and cost",
    maxTokens: 200000,
    costPer1KTokens: "$0.0030",
  },
  {
    id: "claude-3-haiku",
    provider: "anthropic",
    model: "claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Fastest Claude model for quick responses",
    maxTokens: 200000,
    costPer1KTokens: "$0.0025",
  },
  {
    id: "gemini-2.0-flash-001",
    provider: "google",
    model: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    description: "Fastest Gemini model for quick responses",
    maxTokens: 1000000,
    costPer1KTokens: "$0.0004",
  },
  {
    id: "gemini-2.5-pro-exp",
    provider: "google",
    model: "gemini-2.5-pro-exp-03-25",
    name: "Gemini 2.5 Pro (experimental)",
    description: "Preview of Gemini's upcoming flagship",
    maxTokens: 1000000,
    costPer1KTokens: "0.00000"
  }
]

// Helper to get the AI SDK model instance
const getModelInstance = (option: LLMOption) => {
  switch (option.provider) {
    case "openai":
      return openai(option.model as any)
    case "anthropic":
      return anthropic(option.model as any)
    case "google":
      return google(option.model as any)
    default:
      throw new Error(`Unsupported provider: ${option.provider}`)
  }
}

// Format patient data for LLM context
export const formatPatientContext = (patient: Patient, records: PatientRecord[]): string => {
  const patientInfo = `
Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Date of Birth: ${patient.dateOfBirth}
- Medical Record Number: ${patient.mrn}
- Status: ${patient.status}
  `.trim()

  const recordsInfo =
    records.length > 0
      ? `\n\nPatient Records:\n${records
          .map((record) =>
            `
- Type: ${record.type}
- Date: ${record.date}
- Title: ${record.patientEvaluation?.name} | ${record.title}
- Provider: ${record.provider}
- Summary: ${record.patientEvaluation?.patientEvaluationItems} | ${record.summary}
    `.trim(),
          )
          .join("\n\n")}`
      : "\n\nNo patient records available."

  return patientInfo + recordsInfo
}

// Format document data for LLM context
export const formatDocumentContext = (documents: Document[]): string => {
  if (documents.length === 0) return "No documents provided."

  return `
Referenced Documents:
${documents
  .map((doc, index) =>
    `
${index + 1}. ${doc.name}
   - Type: ${doc.type}
   - Category: ${doc.category}
   - Created: ${doc.dateCreated}
   - Size: ${(doc.size / 1024).toFixed(1)} KB
`.trim(),
  )
  .join("\n")}
  `.trim()
}

// Process queue items to create context for LLM
export const processQueueForLLM = (queueItems: QueueItem[]): string => {
  const patients: Patient[] = []
  const records: PatientRecord[] = []
  const documents: Document[] = []

  queueItems.forEach((item) => {
    if (item.type === "patient" && item.data) {
      if ("mrn" in item.data) {
        // It's a patient
        patients.push(item.data as Patient)
      } else if ("patientId" in item.data) {
        // It's a patient record
        records.push(item.data as PatientRecord)
      }
    } else if (item.type === "document" && item.data) {
      documents.push(item.data as Document)
    }
  })

  let context = ""

  // Add patient information
  if (patients.length > 0) {
    patients.forEach((patient) => {
      if (patient) {
        const patientRecords = records.filter((r) => r.patientId === patient.patientId)
        context += formatPatientContext(patient, patientRecords) + "\n\n"
      }
    })
  } else if (records.length > 0) {
    // If we have records but no patient, group by patientId using Map for type safety
    const recordsByPatient = new Map<string, PatientRecord[]>();
    records.forEach(record => {
      if (!recordsByPatient.has(record.patientId)) {
        recordsByPatient.set(record.patientId, []);
      }
      recordsByPatient.get(record.patientId)!.push(record);
    });

    recordsByPatient.forEach((patientRecords, patientId) => {
      if (patientRecords.length > 0) {
        context += `Patient Records (Patient ID: ${patientId}):\n`;
        patientRecords.forEach(record => {
          context +=
            `
- Type: ${record.type}
- Date: ${record.date}
- Title: ${record.title}
- Provider: ${record.provider}
- Summary: ${record.summary}
            `.trim() + "\n\n";
        });
      }
    });
  }

  // Add document information
  if (documents.length > 0) {
    context += formatDocumentContext(documents)
  }

  return context.trim()
}

// LLM Service
export const llmService = {
  // Generate text completion
  generateCompletion: async (prompt: string, context: string, selectedModel: LLMOption): Promise<string> => {
    const model = getModelInstance(selectedModel)

    const systemPrompt = `
You are a medical assistant AI helping with patient information. 
Use the following context to inform your responses, but only reference information that is directly relevant to the query.
Do not make up information that is not in the provided context.

CONTEXT:
${context}
    `.trim()

    try {
      const { text } = await generateText({
        model,
        prompt,
        system: systemPrompt,
        maxTokens: 1000,
      })

      return text
    } catch (error) {
      console.error("Error generating completion:", error)
      throw new Error("Failed to generate response. Please try again.")
    }
  },

  // Stream text completion
  streamCompletion: async (
    prompt: string,
    context: string,
    selectedModel: LLMOption,
    onChunk: (chunk: string) => void,
    onFinish: (fullText: string) => void,
  ) => {
    console.log("🔍 streamCompletion called with model:", selectedModel.provider, selectedModel.name);
    console.log("📝 Prompt:", prompt.substring(0, 50) + "...");
    console.log("📚 Context length:", context?.length || 0);
    
    try {
      console.log("🔧 Using server-side API route for LLM streaming");
      console.log("🔧 Model being used:", selectedModel.provider, selectedModel.model);
      
      let fullText = '';
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Set a timeout to detect if the API call hangs
      timeoutId = setTimeout(() => {
        console.error("⏱️ API call timeout - no response received within 30 seconds");
        onChunk("I'm sorry, but I'm having trouble connecting to the AI service. Please try again in a moment.");
        onFinish("I'm sorry, but I'm having trouble connecting to the AI service. Please try again in a moment.");
      }, 30000);
      
      try {
        // Use the server-side API route for streaming
        const response = await fetch('/api/llm/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            context,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API response error (${response.status}):`, errorText);
          throw new Error(`API response error: ${response.status} ${response.statusText}`);
        }
        
        // Clear the timeout since we got a response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.log("✅ API response received");
        
        // Get the full text response
        const responseText = await response.text();
        console.log("✅ Full response received, length:", responseText.length);
        
        // Simulate streaming by sending chunks of the response
        const chunkSize = 10; // Characters per chunk
        for (let i = 0; i < responseText.length; i += chunkSize) {
          const chunk = responseText.slice(i, i + chunkSize);
          fullText += chunk;
          onChunk(chunk);
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log("✅ Stream completed successfully");
        onFinish(fullText);
      } catch (error) {
        console.error("❌ Error in stream processing:", error);
        
        // Clear the timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Provide a fallback response
        const errorMessage = "I'm sorry, but I encountered an error while generating a response. Please try again.";
        onChunk(errorMessage);
        onFinish(errorMessage);
      }
    } catch (error) {
      console.error("❌ Error in streamCompletion:", error);
      onChunk("Sorry, an error occurred while processing your request.");
      onFinish("Sorry, an error occurred while processing your request.");
    }
  },

  // Test the OpenAI API connection
  testOpenAIConnection: async (): Promise<boolean> => {
    console.log("🧪 Testing OpenAI API connection...");
    try {
      // Use the server-side API route instead of direct SDK call
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Hello, this is a test message. Please respond with 'API is working'.",
          provider: 'openai',
          modelName: 'gpt-3.5-turbo',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ OpenAI API test failed:", errorData);
        return false;
      }

      const data = await response.json();
      console.log("✅ OpenAI API test successful:", data);
      return true;
    } catch (error) {
      console.error("❌ OpenAI API test failed:", error);
      return false;
    }
  },

  // Process and analyze patient data
  analyzePatientData: async (
    patient: Patient,
    records: PatientRecord[],
    query: string,
    selectedModel: LLMOption,
  ): Promise<string> => {
    const context = formatPatientContext(patient, records)
    return llmService.generateCompletion(query, context, selectedModel)
  },

  // Process and analyze documents
  analyzeDocuments: async (documents: Document[], query: string, selectedModel: LLMOption): Promise<string> => {
    const context = formatDocumentContext(documents)
    return llmService.generateCompletion(query, context, selectedModel)
  },
}

export function functionCheck(messageContent: string) {

}
