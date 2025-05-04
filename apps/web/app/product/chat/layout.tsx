'use client';

import { useState, useEffect } from 'react';
import { ChatHistory } from '~/components/chat/chat-history';
import { Dialog, DialogContent, DialogOverlay } from '@kit/ui/dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative flex">
      {children}
      {/* Desktop Chat History */}
      {!isMobile && <ChatHistory />}
      
      {/* Mobile Chat History Dialog */}
      <Dialog open={showChatHistory} onOpenChange={setShowChatHistory}>
        <DialogOverlay className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-linear data-closed:opacity-0" />
        <DialogContent className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chat History</h3>
              <button
                type="button"
                onClick={() => setShowChatHistory(false)}
                className="rounded-full p-1 text-foreground-muted hover:bg-muted transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <ChatHistory isMobileMenu onMobileMenuClose={() => setShowChatHistory(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 