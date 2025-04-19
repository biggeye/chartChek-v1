'use client'

import { PaperClipIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { ArrowDownTrayIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@kit/ui/breadcrumb';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { createClient } from '~/utils/supabase/client';
import { useUserDocuments } from '~/hooks/useUserDocuments';
import { UserDocument, DocumentCategorization } from 'types/store/doc/userDocument';
import { format } from 'date-fns';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';
import { Label } from '@kit/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@kit/ui/select';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';

// Define processing status enum
enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  UNSUPPORTED_FORMAT = 'unsupported_format'
}

// Define Page interface for breadcrumb
interface Page {
  name: string;
  href: string;
  current: boolean;
}

export default function DocumentDetail() {
  const params = useParams();
  const documentId = params.id as string;
  const router = useRouter();
  const { fetchDocumentById, updateDocumentCategorization } = useUserDocuments();
  
  const [document, setDocument] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorization, setCategorization] = useState<DocumentCategorization>({});
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');

  // Fetch document on component mount
  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      try {
        const doc = await fetchDocumentById(documentId);
        if (doc) {
          setDocument(doc);
          // Initialize categorization from document
          setCategorization({
            facility_id: doc.facility_id,
            patient_id: doc.patient_id,
            document_type: doc.document_type,
            compliance_concern: doc.compliance_concern,
            compliance_concern_other: doc.compliance_concern_other,
            tags: doc.tags || []
          });
        } else {
          setError('Document not found');
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    }
  }, [documentId, fetchDocumentById]);

  // Helper function to format processing status
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { color: string, label: string }> = {
      [ProcessingStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      [ProcessingStatus.PROCESSING]: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      [ProcessingStatus.PROCESSED]: { color: 'bg-green-100 text-green-800', label: 'Processed' },
      [ProcessingStatus.FAILED]: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      [ProcessingStatus.UNSUPPORTED_FORMAT]: { color: 'bg-gray-100 text-gray-800', label: 'Unsupported Format' }
    };
    
    const { color, label } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Helper function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Function to handle file download
  const handleDownload = async () => {
    if (!document) {
      console.error('Document is missing');
      return;
    }

    try {
      setIsDownloading(true);
      
      // Create Supabase client
      const supabase = createClient();
      
      if (!document.file_path || !document.bucket) {
        console.error('File path or bucket is missing');
        return;
      }
      
      // Get file from Supabase storage
      const { data, error } = await supabase.storage
        .from(document.bucket)
        .download(document.file_path);
      
      if (error) {
        throw error;
      }
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.file_name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !categorization.tags?.includes(tagInput.trim())) {
      setCategorization({
        ...categorization,
        tags: [...(categorization.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCategorization({
      ...categorization,
      tags: categorization.tags?.filter(t => t !== tag)
    });
  };

  const handleSaveCategorization = async () => {
    if (!document) return;
    
    try {
      setIsSaving(true);
      const success = await updateDocumentCategorization(document.document_id, categorization);
      if (success) {
        // Instead of fetching the document again, just update the local state
        // This prevents the infinite loop
        setDocument({
          ...document,
          ...categorization
        });
        setIsEditing(false);
      } else {
        setError('Failed to update document categorization');
      }
    } catch (error) {
      console.error('Error saving categorization:', error);
      setError(error instanceof Error ? error.message : 'Failed to save categorization');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="sm:col-span-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error || 'Document not found'}</p>
          <Button 
            onClick={() => router.push('/product/documents')} 
            className="mt-4"
          >
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbPages: Page[] = [
    { name: 'Documents', href: '/product/documents', current: false },
    { name: document.file_name || 'Document Details', href: `#`, current: true },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbPages.map((page, index) => (
            <BreadcrumbItem key={page.name}>
              {index < breadcrumbPages.length - 1 ? (
                <BreadcrumbLink href={page.href}>{page.name}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{page.name}</BreadcrumbPage>
              )}
              {index < breadcrumbPages.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{document.file_name}</h1>
        
        <Menu as="div" className="relative ml-3">
          <MenuButton as="div">
            <Button variant="ghost" size="icon" className="rounded-full">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Button>
          </MenuButton>
          <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <ArrowDownTrayIcon className="mr-3 h-5 w-5 text-gray-400" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <PencilIcon className="mr-3 h-5 w-5 text-gray-400" />
                  {isEditing ? 'Cancel Editing' : 'Edit Categorization'}
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
      
      <Card>
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Document Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and metadata about this document.</p>
          </div>
          <div>
            {getStatusBadge(document.processing_status)}
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select
                    value={categorization.document_type}
                    onValueChange={(value: string) => setCategorization({ ...categorization, document_type: value })}
                  >
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document_page_upload">Document Page Upload</SelectItem>
                      <SelectItem value="patient_record">Patient Record</SelectItem>
                      <SelectItem value="compliance_document">Compliance Document</SelectItem>
                      <SelectItem value="facility_document">Facility Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="compliance-concern">Compliance Concern</Label>
                  <Select
                    value={categorization.compliance_concern || 'none'}
                    onValueChange={(value: string) => setCategorization({ 
                      ...categorization, 
                      compliance_concern: value === 'none' ? undefined : value,
                      compliance_concern_other: value !== 'other' ? undefined : categorization.compliance_concern_other
                    })}
                  >
                    <SelectTrigger id="compliance-concern">
                      <SelectValue placeholder="Select compliance concern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="jco">Joint Commission</SelectItem>
                      <SelectItem value="dhcs">DHCS</SelectItem>
                      <SelectItem value="carf">CARF</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {categorization.compliance_concern === 'other' && (
                  <div className="sm:col-span-2">
                    <Label htmlFor="compliance-concern-other">Specify Other Compliance Concern</Label>
                    <Input
                      id="compliance-concern-other"
                      value={categorization.compliance_concern_other || ''}
                      onChange={(e) => setCategorization({ 
                        ...categorization, 
                        compliance_concern_other: e.target.value 
                      })}
                      placeholder="Enter compliance concern"
                    />
                  </div>
                )}
                
                <div className="sm:col-span-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tags"
                      className="flex-1"
                    />
                    <Button 
                      onClick={addTag} 
                      disabled={!tagInput.trim()}
                      type="button"
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categorization.tags?.map((tag) => (
                      <div 
                        key={tag} 
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          onClick={() => removeTag(tag)}
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveCategorization}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">File Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.file_name}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">File Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.file_type || 'Unknown'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">File Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatFileSize(document.file_size)}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Uploaded On</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {document.created_at ? format(new Date(document.created_at), 'PPP') : 'Unknown'}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.document_type || 'Not specified'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Compliance Concern</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {document.compliance_concern === 'other' 
                    ? `Other: ${document.compliance_concern_other || 'Not specified'}`
                    : document.compliance_concern || 'None'}
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {document.tags && document.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No tags</span>
                  )}
                </dd>
              </div>
              
              {document.extracted_text && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Extracted Text</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 rounded border">
                      {document.extracted_text}
                    </div>
                  </dd>
                </div>
              )}
              
              {document.content_summary && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Content Summary</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="p-3 bg-gray-50 rounded border">
                      {document.content_summary}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </Card>
    </div>
  );
}