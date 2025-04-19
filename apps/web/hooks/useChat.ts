import { useState, useCallback } from 'react';
import { useChatStore } from '~/store/chat/chatStore';
import { sendMessageToApi } from '~/lib/services/chatService';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '~/types/chat';

// Define the return type for the hook
interface UseChatReturn {
  isProcessing: boolean;
  error: string | null;
  sendMessageHandler: (content: string, contextContent?: string) => Promise<void>;
  // Add other handlers here later (e.g., createNewChatHandler)
}

export const useChat = (): UseChatReturn => {
  // Global state and actions from Zustand store
  const {
    currentSessionId,
    getCurrentSession,
    addMessage,
    updateStreamingMessage, // Use existing store action
    setIsProcessing: setStoreProcessingState, // Use the actual setIsProcessing action
    setError: setStoreError, // Assume store has an action like this
  } = useChatStore();

  // Hook's internal state (can also use store state if preferred)
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler function to send a message
  const sendMessageHandler = useCallback(async (content: string, contextContent?: string) => {
    if (!currentSessionId) {
      setError('No active chat session selected.');
      setStoreError('No active chat session selected.'); // Also update store error
      return;
    }

    const currentSession = getCurrentSession();
    if (!currentSession) {
      setError('Failed to retrieve current session details.');
      setStoreError('Failed to retrieve current session details.');
      return;
    }

    setIsProcessing(true); // Local hook state
    setStoreProcessingState(true); // Update store processing state
    setError(null);
    setStoreError(null); // Clear store error

    const assistantMessageId = uuidv4(); // Generate assistant message ID upfront

    // Create the user message object
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content,
      createdAt: new Date(),
      // Add context reference if needed later
    };

    // Add empty assistant message placeholder
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // Start with empty content
      createdAt: new Date(),
    };

    // Add user message to the store optimistically
    addMessage(currentSessionId, userMessage);
    // Add assistant message placeholder
    addMessage(currentSessionId, initialAssistantMessage);

    // Construct message history and system prompt for the API
    const apiMessages = [...currentSession.messages, userMessage];
    let systemPromptForApi: string | undefined = undefined; // Initialize as undefined

    if (contextContent) {
        // Simple prepend - adjust formatting as needed based on model requirements
        systemPromptForApi = `Use the following context:\n\n${contextContent}`;
        // Note: If there's a base system message concept elsewhere, combine it here.
        // For now, context *is* the system message when provided.
    }

    try {
      // Define the onChunk callback
      const handleChunk = (chunk: string) => {        
        updateStreamingMessage(currentSessionId!, assistantMessageId, chunk); // Use existing action
      }; 
 
      // Call the stream-enabled service function
      await sendMessageToApi(
        apiMessages,
        systemPromptForApi, // Pass the constructed system prompt
        currentSession.modelConfig,
        handleChunk // Pass the callback
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while sending the message.';
      console.error('[useChat] Error sending message:', err);
      setError(errorMessage);
      setStoreError(errorMessage); // Update store error
      // Optional: Add an error message to the chat UI itself?
      // const errorMessageObj: Message = { ... };
      // addMessage(currentSessionId, errorMessageObj);
    } finally {
      setIsProcessing(false);
      setStoreProcessingState(false); // Update store processing state
    }
  }, [currentSessionId, getCurrentSession, addMessage, updateStreamingMessage, setStoreProcessingState, setStoreError]);

  return {
    isProcessing,
    error,
    sendMessageHandler,
    // Expose other handlers
  };
};
