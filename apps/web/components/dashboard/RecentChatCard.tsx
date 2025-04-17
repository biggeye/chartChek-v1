import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareIcon, UserIcon, BotIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { DashboardCard } from './DashboardCard';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
}

export function RecentChatCard() {
  const router = useRouter();
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch recent chat sessions
        const response = await fetch('/api/chat/sessions');
        
        if (response.ok) {
          const data = await response.json();
          setRecentChats(data.sessions?.slice(0, 3) || []);
        }
      } catch (error) {
        console.error('Error fetching recent chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  return (
    <DashboardCard 
      title="Recent Conversations" 
      description="Your recent AI assistant chats"
      icon={<MessageSquareIcon className="h-5 w-5" />}
      footer={
        <Button 
          variant="ghost" 
          className="w-full justify-center text-indigo_dye-600 hover:text-indigo_dye-900 hover:bg-indigo_dye-50"
          onClick={() => router.push('/protected/chat')}
        >
          Start New Conversation
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : recentChats.length > 0 ? (
        <div className="space-y-4">
          {recentChats.map((chat) => (
            <div 
              key={chat.id} 
              className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
              onClick={() => router.push(`/protected/chat/${chat.id}`)}
            >
              <Avatar className="h-10 w-10 bg-indigo_dye-100">
                <AvatarFallback className="bg-indigo_dye-100 text-indigo_dye-700">
                  <BotIcon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {chat.title || 'Untitled Conversation'}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {chat.lastMessage || 'No messages'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {chat.lastMessageTime ? (
                    formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true })
                  ) : 'Unknown time'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo_dye-50 text-indigo_dye-700">
                  {chat.messageCount || 0} msgs
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">No conversations yet</p>
          <Button 
            onClick={() => router.push('/protected/chat')}
            variant="outline"
          >
            Start Your First Conversation
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
