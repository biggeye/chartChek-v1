import React from 'react';
import { useRouter } from 'next/navigation';
import { FileTextIcon, FileIcon, ClockIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { DashboardCard } from './DashboardCard';
import { Button } from '~/components/ui/button';
import { useUserDocuments } from '~/hooks/useUserDocuments';
import { Skeleton } from '~/components/ui/skeleton';

export function RecentDocumentsCard() {
  const router = useRouter();
  const { documents, isLoading } = useUserDocuments({
    includeDeleted: false
  });
  
  // Get the 5 most recent documents
  const recentDocuments = documents?.slice(0, 5) || [];

  // Function to get appropriate icon based on file type
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileIcon className="h-4 w-4" />;
    
    if (fileType.includes('pdf')) {
      return <FileTextIcon className="h-4 w-4" />;
    }
    
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <DashboardCard 
      title="Recent Documents" 
      description="Your recently uploaded documents"
      icon={<ClockIcon className="h-5 w-5" />}
      footer={
        <Button 
          variant="ghost" 
          className="w-full justify-center text-indigo_dye-600 hover:text-indigo_dye-900 hover:bg-indigo_dye-50"
          onClick={() => router.push('/protected/documents')}
        >
          View All Documents
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      ) : recentDocuments.length > 0 ? (
        <div className="space-y-4">
          {recentDocuments.map((doc) => (
            <div 
              key={doc.document_id} 
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
              onClick={() => router.push(`/protected/documents/${doc.document_id}`)}
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo_dye-50 flex items-center justify-center">
                {getFileIcon(doc.file_type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.file_name}
                </p>
                <p className="text-xs text-gray-500">
                  {doc.created_at ? (
                    <>
                      <span className="hidden md:inline">{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                      <span className="inline md:hidden">{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                    </>
                  ) : 'Unknown date'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {doc.document_type || 'Document'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">No documents uploaded yet</p>
          <Button 
            onClick={() => router.push('/protected/documents')}
            variant="outline"
          >
            Upload Your First Document
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
