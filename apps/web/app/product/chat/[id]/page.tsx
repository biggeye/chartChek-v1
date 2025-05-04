'use client';

import { useParams } from 'next/navigation';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';
import { Loader } from '~/components/loading';
import { ChatPanel } from '../ChatPanel';

export default function HistoricalChatPage() {
  const { id: sessionId } = useParams();
  const { items: contextItems } = useContextQueueStore();

  if (!sessionId) {
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
        sessionId={sessionId as string}
        contextString={Array.isArray(contextItems) ? contextItems.join('\n') : ''}
      />
    </div>
  );
}
