'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Bot, Menu, Plus, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@kit/ui/utils';
import { Button } from '@kit/ui/button';
import { ScrollArea } from '@kit/ui/scroll-area';
import { useHistoryStore } from '~/store/chat/historyStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kit/ui/alert-dialog";

interface ChatHistoryProps {
  /** Whether this is being rendered in the mobile menu */
  isMobileMenu?: boolean;
  /** Callback to close the mobile menu if needed */
  onMobileMenuClose?: () => void;
}

export function ChatHistory({ isMobileMenu, onMobileMenuClose }: ChatHistoryProps) {
  const { id: currentSessionId } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  const { sessions, isLoading, loadSessions, deleteSession, createSession } = useHistoryStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleNewChat = async () => {
    const newSessionId = await createSession();
    router.push(`/product/chat/${newSessionId}`);
    setIsOpen(false);
    onMobileMenuClose?.();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      router.push('/product/chat');
    }
    setSessionToDelete(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    onMobileMenuClose?.();
  };

  const handleChatSelect = (chatId: string) => {
    // If we're not already on the chat route, navigate there
    if (!pathname.startsWith('/product/chat')) {
      router.push(`/product/chat/${chatId}`);
    } else {
      // If already on chat route, just update the chat ID
      router.replace(`/product/chat/${chatId}`);
    }
    // Always collapse the panel after navigation
    setIsOpen(false);
    if (isMobileMenu && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  // If this is being rendered in the mobile menu, we don't need the toggle button
  // or the slide-out panel - just render the content directly
  if (isMobileMenu) {
    return (
      <div className="py-2">
        <Button 
          className="w-full justify-start gap-2 mb-4" 
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="h-16 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No chat history yet
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group relative block p-3 rounded-lg hover:bg-accent transition-colors',
                    currentSessionId === session.id && 'bg-accent'
                  )}
                >
                  <Link
                    href={`/product/chat/${session.id}`}
                    className="block"
                    onClick={() => handleChatSelect(session.id)}
                  >
                    <div className="flex items-start gap-3">
                      {session.messages[0]?.role === 'assistant' ? (
                        <Bot className="h-4 w-4 mt-1 text-primary" />
                      ) : (
                        <User className="h-4 w-4 mt-1 text-primary" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm line-clamp-2">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSessionToDelete(session.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop version with slide-out panel
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-30 md:top-6 md:right-6 hidden lg:flex"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            <motion.div
              className="fixed right-0 top-0 h-full w-80 bg-background border-l z-50 shadow-lg"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <Button 
                    className="w-full justify-start gap-2" 
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i} 
                            className="h-16 bg-muted animate-pulse rounded-lg"
                          />
                        ))}
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        No chat history yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              'group relative block p-3 rounded-lg hover:bg-accent transition-colors',
                              currentSessionId === session.id && 'bg-accent'
                            )}
                          >
                            <Link
                              href={`/product/chat/${session.id}`}
                              className="block"
                              onClick={() => handleChatSelect(session.id)}
                            >
                              <div className="flex items-start gap-3">
                                {session.messages[0]?.role === 'assistant' ? (
                                  <Bot className="h-4 w-4 mt-1 text-primary" />
                                ) : (
                                  <User className="h-4 w-4 mt-1 text-primary" />
                                )}
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm line-clamp-2">
                                    {session.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(session.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSessionToDelete(session.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => sessionToDelete && handleDeleteSession(sessionToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 