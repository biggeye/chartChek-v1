'use client'

import { UserDocument } from "types/store/doc/userDocument";
import { Input } from '~/components/ui/input';
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '~/components/ui/skeleton';

interface UserDocumentsTableProps {
  documents: UserDocument[];
  detailsUrlPrefix?: string;
  onFileSelect?: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export default function UserDocumentsTable({ 
  documents, 
  detailsUrlPrefix = '/product/documents', 
  onFileSelect,
  isLoading = false 
}: UserDocumentsTableProps) {
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      await onFileSelect(file);
    }
  };

  // Helper function to format processing status
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { color: string, label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'processing': { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      'processed': { color: 'bg-green-100 text-green-800', label: 'Processed' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' },
      'unsupported_format': { color: 'bg-gray-100 text-gray-800', label: 'Unsupported Format' }
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden ring-1 shadow-sm ring-black/5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        File Name
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Size
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Uploaded
                      </th>
                      <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="py-4 pr-3 pl-4 sm:pl-6">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td className="hidden md:table-cell px-3 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="hidden md:table-cell px-3 py-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="hidden md:table-cell px-3 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="hidden md:table-cell px-3 py-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="relative py-4 pr-4 pl-3 text-right sm:pr-6">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading a document.</p>
        
        {onFileSelect && (
          <div className="mt-6">
            <label
              htmlFor="file-upload"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
            >
              <ArrowUpTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Upload a document
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden ring-1 shadow-sm ring-black/5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      File Name
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Size
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Uploaded
                    </th>
                    <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents.map((doc) => (
                    <tr key={doc.document_id}>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6">
                        {doc.file_name}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {doc.file_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {getStatusBadge(doc.processing_status)}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : 'Unknown'}
                      </td>
                      <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                        <Link 
                          href={`${detailsUrlPrefix}/${doc.document_id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View<span className="sr-only">, {doc.file_name}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
