'use client'

import { UserDocument } from "types/store/doc/userDocument";
import { Input } from '@kit/ui/input';
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { Badge } from '@kit/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@kit/ui/skeleton';
import { logger } from '~/lib/logger';
import { useEffect, useState } from 'react';
import { Button } from '@kit/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kit/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@kit/ui/dialog';
import { useUserDocuments } from '~/hooks/useUserDocuments';
import { formatDate, formatFileSize } from '~/lib/utils';

interface UserDocumentsTableProps {
  documents: UserDocument[];
  detailsUrlPrefix?: string;
  onFileSelect?: (file: File) => Promise<void>;
  isLoading?: boolean;
  onChunk?: (documentId: string) => void;
}

export default function UserDocumentsTable({ 
  documents, 
  detailsUrlPrefix = '/product/documents', 
  onFileSelect,
  isLoading = false,
  onChunk
}: UserDocumentsTableProps) {
  const { deleteDocument, isDeleting } = useUserDocuments();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [chunkDialogDocId, setChunkDialogDocId] = useState<string | null>(null);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);

  logger.info('[UserDocumentsTable] Initializing table', { 
    documentCount: documents.length,
    isLoading 
  })
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug('[UserDocumentsTable] File input change detected')
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      logger.info('[UserDocumentsTable] Processing file selection', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      try {
        await onFileSelect(file);
        logger.info('[UserDocumentsTable] File selection processed successfully')
      } catch (error) {
        logger.error('[UserDocumentsTable] Error processing file selection:', error)
      }
    }
  };

  // Helper function to format processing status
  const getStatusBadge = (status?: string) => {
    if (!status) {
      logger.debug('[UserDocumentsTable] No status provided for badge')
      return null;
    }
    
    const statusMap: Record<string, { color: string, label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'processing': { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      'processed': { color: 'bg-green-100 text-green-800', label: 'Processed' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' },
      'unsupported_format': { color: 'bg-gray-100 text-gray-800', label: 'Unsupported Format' }
    };
    
    const { color, label } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    logger.debug('[UserDocumentsTable] Generated status badge', { status, label, color })
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Helper function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) {
      logger.debug('[UserDocumentsTable] No file size provided')
      return 'Unknown';
    }
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    const formattedSize = `${size.toFixed(1)} ${units[unitIndex]}`;
    logger.debug('[UserDocumentsTable] Formatted file size', { 
      originalBytes: bytes,
      formattedSize 
    })
    return formattedSize;
  };

  // Log component updates
  useEffect(() => {
    logger.debug('[UserDocumentsTable] Component state updated', {
      documentCount: documents.length,
      isLoading,
      hasFileSelectHandler: !!onFileSelect
    })
  }, [documents, isLoading, onFileSelect])

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleChunk = (documentId: string) => {
    if (onChunk) {
      onChunk(documentId);
    } else {
      setChunkDialogDocId(documentId);
    }
  };

  const handleChunkSubmit = async () => {
    if (!chunkDialogDocId) return;
    try {
      await onChunk?.(chunkDialogDocId);
      setChunkDialogDocId(null);
    } catch (error) {
      console.error('Chunking failed:', error);
    }
  };

  // Loading skeleton
  if (isLoading) {
    logger.info('[UserDocumentsTable] Rendering loading state')
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
    logger.info('[UserDocumentsTable] Rendering empty state')
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

  logger.info('[UserDocumentsTable] Rendering document table', { 
    documentCount: documents.length 
  })

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.document_id}>
              <TableCell className="font-medium">{doc.title || doc.file_name}</TableCell>
              <TableCell>{doc.document_type || 'Unknown'}</TableCell>
              <TableCell>{formatFileSize(Number(doc.file_size))}</TableCell>
              <TableCell>{formatDate(doc.created_at)}</TableCell>
              <TableCell>
                {doc.processing_status === 'pending' && 'Pending'}
                {doc.processing_status === 'processing' && 'Processing'}
                {doc.processing_status === 'completed' && (
                  doc.has_embeddings ? 'Embedded' : 'Ready for Embedding'
                )}
                {doc.processing_status === 'error' && 'Error'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChunk(doc.document_id)}
                    disabled={doc.processing_status === 'processing' || doc.has_embeddings}
                  >
                    Chunk
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteConfirmId(doc.document_id)}
                    disabled={isDeleting}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this document? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chunk Dialog */}
      {!onChunk && (
        <Dialog open={!!chunkDialogDocId} onOpenChange={() => setChunkDialogDocId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Chunking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Chunk Size</label>
                <Input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  min={100}
                  max={5000}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chunk Overlap</label>
                <Input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  min={0}
                  max={1000}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChunkDialogDocId(null)}>
                Cancel
              </Button>
              <Button onClick={handleChunkSubmit}>
                Start Chunking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
