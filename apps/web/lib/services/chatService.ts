import type { Message, ModelConfig } from '~/types/chat';

/**
 * Sends messages to the backend chat stream API and processes the streamed response.
 * 
 * @param messages - The array of messages in the conversation history.
 * @param systemMessage - An optional system message to guide the AI.
 * @param modelConfig - The configuration for the AI model to use.
 * @param onChunk - A callback function invoked with each received text chunk.
 * @throws Error if the API call fails or the stream cannot be processed.
 */
export const sendMessageToApi = async (
  messages: Message[],
  systemMessage: string | undefined,
  modelConfig: ModelConfig,
  onChunk: (chunk: string) => void // Added callback for streaming chunks
): Promise<void> => { // Return type changed to void
  const endpoint = '/api/chat/stream'; // Changed to stream endpoint

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, systemMessage, modelConfig }),
    });

    if (!response.ok) {
      let errorBody = 'Unknown API error';
      try {
        // Try to parse error from body, but fallback if it's not JSON
        const errorData = await response.json();
        errorBody = errorData.error || `API responded with status ${response.status}`;
      } catch (parseError) {
        errorBody = `API responded with status ${response.status}`;
      }
      throw new Error(errorBody);
    }

    // --- Stream Processing Logic ---
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let reading = true;

    while (reading) {
      const { done, value } = await reader.read();
      if (done) {
        reading = false;
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk); // Call the provided callback with the decoded chunk
    }
    // --- End Stream Processing Logic ---

  } catch (error) {
    console.error('[chatService] Error sending message to stream API:', error);
    // Re-throw the error to be handled by the caller (e.g., the hook)
    throw error instanceof Error ? error : new Error('Failed to get stream response');
  }
};