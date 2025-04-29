'use client';

import React from 'react';
import { cn } from '@kit/ui/utils';
import { useChat } from '@ai-sdk/react';
import { MessageList } from '~/components/chat/message-list';
import { MessageInput } from '~/components/chat/message-input';



export default function ChatPage() {

  return (
    <div
      className={cn(
        'flex flex-col h-[calc(100vh-10rem)]',
        'border border-border rounded-md shadow-sm bg-background'
      )}
    >
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList />
      </div>
    </div>
  );
}
