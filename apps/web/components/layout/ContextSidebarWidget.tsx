'use client';

import React from 'react';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';
import { useIsProcessingContext, useProcessingContextError } from '~/store/chat/contextProcessorStore';
import type { ContextItem } from 'types/chat';
import { Button } from '@kit/ui/button'; // Fix path
import { Checkbox } from '@kit/ui/checkbox'; // Fix path
import { XCircleIcon } from '@heroicons/react/24/solid';
import { Loader2 } from 'lucide-react'; // Example loading icon

export function ContextSidebarWidget() {
  const items = useContextQueueStore((state) => state.items);
  const removeItem = useContextQueueStore((state) => state.removeItem);
  const toggleItem = useContextQueueStore((state) => state.toggleItem);
  const clearQueue = useContextQueueStore((state) => state.clearQueue);

  const isProcessing = useIsProcessingContext();
  const error = useProcessingContextError();

  return (
    <aside className="hidden lg:block w-64 xl:w-72 border-l border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-gray-100">Context Queue</h3>
        {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm p-2 bg-red-100 dark:bg-red-900/30 rounded">
          Error: {error}
        </div>
      )}

      {items.length === 0 && !isProcessing && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Context queue is empty.</p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800 flex items-start space-x-2">
            <Checkbox
              id={`context-item-${item.id}`}
              checked={item.selected}
              onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor={`context-item-${item.id}`} className="text-sm font-medium block cursor-pointer">
                {item.title}
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{item.type}</span>
              {/* TODO: Add more detail display if needed, e.g., for evaluation items */}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              onClick={() => removeItem(item.id)}
              aria-label="Remove item"
            >
              <XCircleIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <Button variant="outline" size="sm" onClick={clearQueue} className="w-full">
          Clear All
        </Button>
      )}
    </aside>
  );
}
