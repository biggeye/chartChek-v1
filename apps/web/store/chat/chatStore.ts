'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { ChatSession, Message, ModelConfig, ContextItem, ModelProvider } from "types/chat";
import { LLMOption, LLM_OPTIONS, LLMProvider, llmService } from "~/lib/llm-service";
import { type TrainingDataset, TRAINING_DATASETS } from "types/trainingDatasets";
import { conversationService, messageService } from "~/lib/chat/service";
import type { 
  DbConversation, 
  DbMessage, 
  DbModelConfig 
} from "types/chat";
import { getCurrentUserId } from "~/utils/supabase/user";
import { createClient } from "~/utils/supabase/client";

// Enhanced model config that extends our existing type
interface EnhancedModelConfig extends ModelConfig {
  assistantId: string | null;
  trainingDatasetId: string | null;
  modelId: string | null;
}

// Enhanced chat session that extends our existing type
interface EnhancedChatSession extends ChatSession {
  threadId: string | null;
  modelConfig: EnhancedModelConfig;
}

interface ChatState {
  sessions: EnhancedChatSession[];
  currentSessionId: string | null;
  isProcessing: boolean;
  isTyping: boolean;
  error: string | null;
  availableModels: LLMOption[];
  availableTrainingDatasets: TrainingDataset[];
  selectedModel: LLMOption | null;

  createSession: (modelConfig?: Partial<ModelConfig>, systemMessage?: string, trainingDataset?: string) => Promise<string>;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  getCurrentSession: () => EnhancedChatSession | undefined;
  updateSessionTitle: (sessionId: string, title: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, prompt: string, context?: string) => Promise<void>;
  updateStreamingMessage: (sessionId: string, messageId: string, chunk: string) => void;
  finalizeMessage: (sessionId: string, messageId: string, finalContent: string) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;

  updateModelSelection: (sessionId: string, modelId: string) => void;
  updateAssistantSelection: (sessionId: string, assistantId: string | null) => void;
  updateDatasetSelection: (sessionId: string, datasetId: string | null) => void;

  setIsProcessing: (isProcessing: boolean) => void;
  setIsTyping: (isTyping: boolean) => void;
  setError: (error: string | null) => void;
}

const dbConversationToSession = (conversation: DbConversation, messages: DbMessage[]): EnhancedChatSession => {
  const { provider, modelName } = conversation.model_config;
  
  const modelOption = LLM_OPTIONS.find(
    (option) => option.provider === provider && option.name === modelName
  );
  
  return {
    id: conversation.id,
    title: conversation.title || "New Conversation",
    threadId: conversation.id, 
    messages: messages.map(dbMessageToMessage),
    modelConfig: {
      provider: provider as ModelProvider,
      modelName: modelName,
      assistantId: null, 
      trainingDatasetId: null,
      modelId: modelOption?.id || null,
    },
    createdAt: new Date(conversation.created_at),
    updatedAt: new Date(conversation.updated_at),
  };
};

const dbMessageToMessage = (message: DbMessage): Message => {
  return {
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    content: message.content,
    createdAt: new Date(message.created_at),
  };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isProcessing: false,
      isTyping: false,
      error: null,
      availableModels: LLM_OPTIONS,
      availableTrainingDatasets: TRAINING_DATASETS,
      selectedModel: null,

      createSession: async (modelConfig?: Partial<ModelConfig>, systemMessage?: string, trainingDataset?: string) => {
        try {
          const userId = await getCurrentUserId();
         
          let userPreferredModelId = null;
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('user_api_settings')
              .select('default_model_id')
              .eq('user_id', userId)
              .single();
            
            if (data && data.default_model_id) {
              userPreferredModelId = data.default_model_id;
            }
          } catch (error) {
            console.warn("Could not load user model preferences:", error);
          }

          const defaultModelConfig: EnhancedModelConfig = {
            provider: "google",
            modelName: "gemini-2.5-pro-exp-03-25",
            assistantId: null,
            trainingDatasetId: null,
            modelId: "gemini-2.5-pro-exp",
          };
          
          if (userPreferredModelId) {
            const preferredModel = LLM_OPTIONS.find(option => option.id === userPreferredModelId);
            if (preferredModel) {
              defaultModelConfig.provider = preferredModel.provider as ModelProvider;
              defaultModelConfig.modelName = preferredModel.name;
              defaultModelConfig.modelId = preferredModel.id;
            }
          }
          
          const config = { ...defaultModelConfig, ...modelConfig };
          
          // If a training dataset is specified, fetch its content to use as system message
          let finalSystemMessage = systemMessage;
          if (trainingDataset) {
            try {
              const trainingData = TRAINING_DATASETS.find(dataset => dataset.id === trainingDataset);
              if (trainingData?.typeId) {
                const userDocumentStore = (await import('../doc/userDocumentStore')).useUserDocumentStore.getState();
                const trainingContent = await userDocumentStore.fetchTrainingData(trainingData.typeId);
                
                if (trainingContent) {
                  console.log(`Using training dataset: ${trainingData.name}`);
                  // Combine with existing system message if present
                  finalSystemMessage = systemMessage 
                    ? `${systemMessage}\n\n${trainingContent}`
                    : trainingContent;
                }
              }
            } catch (error) {
              console.error("Error fetching training dataset:", error);
              // Continue with original system message if there's an error
            }
          }
          
          // Create conversation with proper model config
          const sessionId = await conversationService.createConversation(
            "New Conversation",
            {
              provider: config.provider,
              modelName: config.modelName,
              // Include metadata in the model config if we have a system message
              ...(finalSystemMessage ? { metadata: { system_message: finalSystemMessage } } : {})
            },
            userId
          );
          
          // If we have a system message, store it in the context queue
                  
          const model = LLM_OPTIONS.find(
            (option) => 
              option.provider === config.provider && 
              option.name === config.modelName
          ) || LLM_OPTIONS[0]; 
          
          const newSession: EnhancedChatSession = {
            id: sessionId,
            title: "New Conversation",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            threadId: null,
            modelConfig: {
              ...config,
              modelId: model?.id ?? null, // Use optional chaining and nullish coalescing
            },
          };
          
          set((state) => ({
            sessions: [...state.sessions, newSession],
            currentSessionId: sessionId,
            selectedModel: model,
          }));
          
          return sessionId;
        } catch (error) {
          console.error("Error creating session:", error);
          set({ error: error instanceof Error ? error.message : "Failed to create session" });
          throw error;
        }
      },

      deleteSession: async (sessionId) => {
        try {
          await conversationService.deleteConversation(sessionId);

          set((state) => {
            const updatedSessions = state.sessions.filter((session) => session.id !== sessionId);
            const newCurrentId = state.currentSessionId === sessionId 
              ? (updatedSessions.length > 0 ? updatedSessions[0]?.id : null) // Use optional chaining
              : state.currentSessionId;
            
            return {
              sessions: updatedSessions,
              currentSessionId: newCurrentId,
            };
          });
        } catch (error) {
          console.error("Error deleting session:", error);
          set({ error: error instanceof Error ? error.message : "Failed to delete session" });
        }
      },

      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId });
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find((session) => session.id === currentSessionId);
      },

      updateSessionTitle: async (sessionId, title) => {
        try {
          await conversationService.updateConversation(sessionId, { title });

          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === sessionId ? { ...session, title } : session
            ),
          }));
        } catch (error) {
          console.error("Error updating session title:", error);
          set({ error: error instanceof Error ? error.message : "Failed to update session title" });
        }
      },

      addMessage: (sessionId: string, message: Message) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, message],
                  updatedAt: new Date(), // Update timestamp when message is added
                }
              : session
          ),
        }));
      },

      fetchMessages: async (sessionId) => {
        try {
          set({ isProcessing: true, error: null });

          const session = get().sessions.find((s) => s.id === sessionId);
          if (!session) {
            throw new Error("Session not found");
          }

          const dbMessages = await messageService.getMessages(sessionId);
          
          const messages = dbMessages.map(dbMessageToMessage);

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, messages } : s
            ),
            isProcessing: false,
          }));
        } catch (error) {
          console.error("Error fetching messages:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch messages",
            isProcessing: false,
          });
        }
      },

      sendMessage: async (sessionId, prompt, context?: string) => {
        try {
          console.log("🔍 Starting sendMessage with prompt:", prompt.substring(0, 50) + "...");
          set({ isProcessing: true, error: null });
          
          const session = get().sessions.find((s) => s.id === sessionId);
          if (!session) {
            throw new Error("Session not found");
          }
          
          const tempMessageId = uuidv4();
          
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: [
                      ...s.messages,
                      {
                        id: tempMessageId,
                        role: "user",
                        content: prompt,
                        createdAt: new Date(),
                      },
                    ],
                  }
                : s
            ),
          }));
          const userId = await getCurrentUserId();
          
          await messageService.createMessage(sessionId, "user", prompt, userId);
          
          const responseMessageId = uuidv4();
          
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: [
                      ...s.messages,
                      {
                        id: responseMessageId,
                        role: "assistant",
                        content: "",
                        createdAt: new Date(),
                      },
                    ],
                  }
                : s
            ),
          }));
          
          const apiMessages = session.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));
          
          apiMessages.push({
            role: "user",
            content: prompt,
          });
          
          let systemMessage = '';
          try {
            const contextQueueStore = await import('./contextQueueStore').then(module => module.useContextQueueStore.getState());
            systemMessage = await contextQueueStore.getContextFromQueue(sessionId);
            console.log("Retrieved context:", systemMessage ? "Context available" : "No context available");
          } catch (contextError) {
            console.error("Failed to retrieve context:", contextError);
            // Continue without context if there's an error
          }
          
          const modelConfig = {
            provider: session.modelConfig.provider || "openai",
            modelName: session.modelConfig.modelName || "gpt-4-turbo-preview",
            temperature: 0.7,
            maxTokens: 1000,
          };
          
          console.log("🤖 Sending to LLM API with model config:", modelConfig);
          
          const apiUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/api/chat/stream`
            : '/api/chat/stream';
            
          console.log("🔌 Calling API at:", apiUrl);
          
          try {
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: apiMessages,
                systemMessage: systemMessage || '',
                modelConfig,
              }),
            });
            
            console.log("📡 API response status:", response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ API error response:", errorText);
              try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || "Failed to get response from API");
              } catch (parseError) {
                throw new Error(`API error (${response.status}): ${errorText || "No error details available"}`);
              }
            }
            
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("Failed to get response reader");
            }
            
            let accumulatedResponse = "";
            
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              const chunk = new TextDecoder().decode(value);
              accumulatedResponse += chunk;
              
              get().updateStreamingMessage(sessionId, responseMessageId, chunk);
            }
            
            get().finalizeMessage(sessionId, responseMessageId, accumulatedResponse);
            
            console.log("✅ Completed LLM response");
            
          } catch (error) {
            console.error("Error sending message:", error);
            set({ 
              error: error instanceof Error ? error.message : "Failed to send message",
              isProcessing: false,
              isTyping: false,
            });
          }
        } catch (error) {
          console.error("Error sending message:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to send message",
            isProcessing: false,
            isTyping: false,
          });
        }
      },

      updateStreamingMessage: (sessionId, messageId, chunk) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? { ...message, content: message.content + chunk }
                      : message
                  ),
                }
              : session
          ),
        }));
      },

      finalizeMessage: (sessionId, messageId, finalContent) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? { ...message, content: finalContent }
                      : message
                  ),
                }
              : session
          ),
          isTyping: false,
        }));
      },

      deleteMessage: async (sessionId, messageId) => {
        try {
          const session = get().sessions.find((s) => s.id === sessionId);
          if (!session) {
            throw new Error("Session not found");
          }

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: s.messages.filter((m) => m.id !== messageId),
                  }
                : s
            ),
          }));
        } catch (error) {
          console.error("Error deleting message:", error);
          set({ error: error instanceof Error ? error.message : "Failed to delete message" });
        }
      },

      updateModelSelection: async (sessionId, modelId) => {
        try {
          const model = LLM_OPTIONS.find(
            (option) => option.id === modelId
          );
          if (!model) {
            throw new Error("Model not found");
          }

          const dbModelId = `${model.provider}:${model.name}`;
          
          await conversationService.updateModelSelection(sessionId, dbModelId);

          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    modelConfig: {
                      ...session.modelConfig,
                      provider: model.provider as ModelProvider,
                      modelName: model.name,
                      modelId: model.id,
                    },
                  }
                : session
            ),
            selectedModel: model,
          }));
        } catch (error) {
          console.error("Error updating model selection:", error);
          set({ error: error instanceof Error ? error.message : "Failed to update model selection" });
        }
      },

      updateAssistantSelection: (sessionId, assistantId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  modelConfig: {
                    ...session.modelConfig,
                    assistantId,
                  },
                }
              : session
          ),
        }));
      },

      updateDatasetSelection: (sessionId, datasetId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  modelConfig: {
                    ...session.modelConfig,
                    trainingDatasetId: datasetId,
                  },
                }
              : session
          ),
        }));
      },

      setIsProcessing: (isProcessing) => {
        set({ isProcessing });
      },

      setIsTyping: (isTyping) => {
        set({ isTyping });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: "chatStore",
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        selectedModel: state.selectedModel,
      }),
    }
  )
);

function mapProviderType(provider: LLMProvider): ModelProvider {
  switch (provider) {
    case "openai":
      return "openai";
    case "google":
      return "google";
    case "anthropic":
      return "anthropic";
    default:
      return "custom";
  }
}

export default useChatStore;
