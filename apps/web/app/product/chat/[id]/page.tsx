'use client';

import { useSessionManager } from '~/hooks/useSessionManager';
import { Loader } from '~/components/loading';
import { ChatPanel } from '../../../../components/chat/ChatPanel';

export default function HistoricalChatPage() {
  const { currentSessionId, contextString, ensureSession, isCreatingSession } = useSessionManager();

  if (!currentSessionId || isCreatingSession) {
    return (
      <Loader
        showLogo={false}
        size="sm"
        message="Loading chat session..."
      />
    );
  }

  return (
    <div className="flex flex-col">
      <ChatPanel
        sessionId={currentSessionId}
        contextString={contextString}
      />
    </div>
  );
}
