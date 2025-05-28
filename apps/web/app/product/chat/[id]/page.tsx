'use client';

import { useSessionManager } from '~/hooks/useSessionManager';
import { Loader } from '~/components/loading';
import { ChatPanel } from '../../../../components/chat/ChatPanel';

export default function HistoricalChatPage() {
  const { currentSessionId, ensureSession, isCreatingSession } = useSessionManager();

  if (!currentSessionId || currentSessionId === 'undefined' || isCreatingSession) {
    return (
      <Loader
        showLogo={false}
        size="sm"
        message="Loading chat session..."
      />
    );
  }

  if (currentSessionId === 'undefined') {
    console.error('[HistoricalChatPage] sessionId is undefined!');
  }
  console.log('[HistoricalChatPage] Rendering ChatPanel with sessionId:', currentSessionId);

  return (
    <div className="flex flex-col">
      <ChatPanel sessionId={currentSessionId} />
    </div>
  );
}
