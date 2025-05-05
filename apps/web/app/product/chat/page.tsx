'use client';
import { useEffect, useState } from 'react';
import { useSessionManager } from '~/hooks/useSessionManager';
import { Loader } from '~/components/loading';
import { ChatPanel } from '../../../components/chat/ChatPanel';

export default function ChatPage() {
  const { currentSessionId, contextString, ensureSession, isCreatingSession } = useSessionManager();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentSessionId && !isCreatingSession) {
      ensureSession().catch(err => {
        console.error('Failed to create session:', err);
        setError(err as Error);
      });
    }
  }, [currentSessionId, ensureSession, isCreatingSession]);

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  if (!currentSessionId || isCreatingSession) {
    return (
      <Loader
        showLogo={false}
        size="sm"
        message="Loading session..."
      />
    );
  }

  return <ChatPanel sessionId={currentSessionId} contextString={contextString} />;
}