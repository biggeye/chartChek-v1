'use client'

import { useState, useCallback } from 'react'
import { Button } from '@kit/ui/button'
import UserDocumentUploadDialog from '~/components/documents/UserDocumentUploadDialog'
import UserDocumentsTable from '~/components/documents/UserDocumentTable'
import { PlusIcon } from '@heroicons/react/20/solid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { ScrollArea } from '@kit/ui/scroll-area'
import { useUserDocuments } from '~/hooks/useUserDocuments'
import { DocumentCategorization } from '~/types/store/doc/userDocument'

export default function DocumentsPage() {
  const { 
    documents, 
    isLoading, 
    error, 
    refetch,
    uploadAndProcessDocument
  } = useUserDocuments()
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Handle document upload
  const handleFileUpload = useCallback(async (file: File, categorization: DocumentCategorization): Promise<void> => {
    console.log('[DocumentsPage:handleFileUpload] Starting file upload process', {
      file_name: file.name,
      fileSize: file.size,
      categorization
    })

    if (file) {
      setUploadError(null)
      try {
        // Upload and process the document
        const result = await uploadAndProcessDocument(file, categorization)
        
        if (result) {
          console.log('[DocumentsPage:handleFileUpload] Upload successful:', result)
          setIsUploadDialogOpen(false)
          // Refresh the documents list
          refetch()
        } else {
          console.error('[DocumentsPage:handleFileUpload] Upload failed: No result returned')
          setUploadError('Upload failed. Please try again.')
        }
      } catch (error) {
        console.error('[DocumentsPage:handleFileUpload] Upload error:', error)
        setUploadError((error as Error).message || 'Upload failed. Please try again.')
      }
    } else {
      console.error('[DocumentsPage:handleFileUpload] No file provided')
      setUploadError('No file selected. Please select a file to upload.')
    }
  }, [uploadAndProcessDocument, refetch])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error.message || String(error)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Documents</h2>
        <Button 
          onClick={() => setIsUploadDialogOpen(true)}
          className="rounded-full p-2 h-9 w-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white"
          disabled={isLoading}
        >
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>
    
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="patient">Patient Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Documents</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[calc(100vh-20rem)] overflow-y-auto">
          <TabsContent value="all" className="mt-4">
            <UserDocumentsTable 
              documents={documents} 
              isLoading={isLoading}
              detailsUrlPrefix="/product/documents"
            />
          </TabsContent>
          
          <TabsContent value="patient" className="mt-4">
            <UserDocumentsTable 
              documents={documents.filter(doc => doc.document_type === 'patient_record')} 
              isLoading={isLoading}
              detailsUrlPrefix="/product/documents"
            />
          </TabsContent>
          
          <TabsContent value="compliance" className="mt-4">
            <UserDocumentsTable 
              documents={documents.filter(doc => doc.document_type === 'compliance_document')} 
              isLoading={isLoading}
              detailsUrlPrefix="/product/documents"
            />
          </TabsContent>
        </ScrollArea> 
      </Tabs>

      <UserDocumentUploadDialog 
        isOpen={isUploadDialogOpen} 
        onClose={() => setIsUploadDialogOpen(false)} 
        onUpload={handleFileUpload}
        isLoading={isLoading}
        error={uploadError}
      />
    </div>
  )
}
