'use client';
import { useEffect, useState } from 'react';
import { useSessionManager } from '~/hooks/useSessionManager';
import { Loader } from '~/components/loading';
import { ChatPanel } from '../../../components/chat/ChatPanel';

export default function ChatPage() {
  const { currentSessionId, ensureSession, isCreatingSession } = useSessionManager();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if ((!currentSessionId || currentSessionId === 'undefined') && !isCreatingSession) {
      console.warn('[ChatPage] No valid sessionId, calling ensureSession');
      ensureSession().catch(err => {
        setError(err as Error);
      });
    } else if (currentSessionId === 'undefined') {
      console.error('[ChatPage] sessionId is undefined!');
    }
  }, [currentSessionId, ensureSession, isCreatingSession]);

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  if (!currentSessionId || currentSessionId === 'undefined' || isCreatingSession) {
    return (
      <Loader
        showLogo={false}
        size="sm"
        message="Loading session..."
      />
    );
  }

  return <ChatPanel sessionId={currentSessionId} />;
}