import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '~/utils/supabase/client';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { 
  PlusCircleIcon, 
  FileTextIcon, 
  UsersIcon, 
  MessageSquareIcon,
  ArrowRightIcon
} from 'lucide-react';

export function WelcomeCard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const supabase = createClient();
  
  useEffect(() => {
    // Get time-based greeting
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 18) {
      timeGreeting = 'Good afternoon';
    }
    
    setGreeting(timeGreeting);
    
    // Fetch user profile
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user profile from database
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
          
        if (data && data.first_name) {
          setUserName(data.first_name);
        } else if (user.email) {
          // Fallback to email username
          // Provide fallback in case split results in undefined/null unexpectedly
          setUserName(user.email.split('@')[0] ?? 'User'); 
        }
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // Quick action buttons
  const quickActions = [
    {
      label: 'Upload Document',
      icon: <FileTextIcon className="h-4 w-4 mr-2" />,
      onClick: () => router.push('/product/documents')
    },
    {
      label: 'View Patients',
      icon: <UsersIcon className="h-4 w-4 mr-2" />,
      onClick: () => router.push('/product/patients')
    },
    {
      label: 'Start Chat',
      icon: <MessageSquareIcon className="h-4 w-4 mr-2" />,
      onClick: () => router.push('/product/chat')
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-indigo_dye-50 to-columbia_blue-50 border-none shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-indigo_dye-900">
              {greeting}{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-indigo_dye-700 mt-1">
              Welcome to chartChek. Here's what's happening today.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-indigo_dye-50"
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
