'use client'

import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DocumentCategorization } from 'types/store/doc/userDocument'
import { Transition } from '@headlessui/react'
import { Label } from '~/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select-new'
import { Input } from '~/components/ui/input'
import { useFacilityStore } from '~/store/patient/facilityStore'
import { createClient } from '~/utils/supabase/client'

// Initialize Supabase client
const supabase = createClient();

interface UserDocumentUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, categorization: DocumentCategorization) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export default function UserDocumentUploadDialog({
  isOpen,
  onClose,
  onUpload,
  isLoading = false,
  error = null
}: UserDocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [categorization, setCategorization] = useState<DocumentCategorization>({
    document_type: 'document_page_upload',
    tags: []
  })
  const { currentFacilityId } = useFacilityStore()
  const [facilityUuid, setFacilityUuid] = useState<string | null>(null)
  const [facilityName, setFacilityName] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState<string>('')

  // Fetch facility data when currentFacilityId changes
  useEffect(() => {
    if (currentFacilityId) {
      const fetchFacilityData = async () => {
        try {
          const { data, error } = await supabase
            .from('facilities')
            .select('id, name')
            .eq('kipu_id', currentFacilityId)
            .single();
          
          if (error) {
            console.error('Error fetching facility data:', error);
            return;
          }
          
          if (data) {
            setFacilityUuid(data.id);
            setFacilityName(data.name);
            
            // Update the categorization with the facility UUID
            setCategorization(prev => ({
              ...prev,
              facility_id: data.id
            }));
          }
        } catch (err) {
          console.error('Error in facility data lookup:', err);
        }
      };
      
      fetchFacilityData();
    }
  }, [currentFacilityId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[UserDocumentUploadDialog] File input change event triggered');
    const file = e.target.files?.[0]
    if (file) {
      console.log('[UserDocumentUploadDialog] File selected:', file.name, file.type, file.size);
      setSelectedFile(file)
    } else {
      console.log('[UserDocumentUploadDialog] No file selected from input');
    }
  }
  
  const handleUpload = async () => {
    console.log('[UserDocumentUploadDialog] Upload button clicked, selectedFile:', selectedFile?.name);
    if (selectedFile) {
      try {
        console.log('[UserDocumentUploadDialog] Calling onUpload with file and categorization:', categorization);
        await onUpload(selectedFile, categorization)
        // Reset form after successful upload
        setSelectedFile(null)
        setCategorization({
          document_type: 'document_page_upload',
          tags: []
        })
        setTagInput('')
        onClose()
      } catch (error) {
        console.error('[UserDocumentUploadDialog] Error in handleUpload:', error)
      }
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !categorization.tags?.includes(tagInput.trim())) {
      setCategorization({
        ...categorization,
        tags: [...(categorization.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setCategorization({
      ...categorization,
      tags: categorization.tags?.filter(t => t !== tag)
    })
  }
  
  return (
    <Transition
      show={isOpen}
      enter="transition duration-300 ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition duration-200 ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <Transition.Child
          enter="transition duration-300 ease-out"
          enterFrom="transform scale-50 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-200 ease-in"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-50 opacity-0"
        >
          <div className="relative bg-white rounded-xl shadow-xl w-[80vw] max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-grow">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {!selectedFile ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-4">Click to select or drag and drop a file</p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    Select File
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedFile(null)}
                      variant="outline"
                      size="sm"
                    >
                      Change
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="text-sm font-medium mb-3">Document Categorization</h3>
                    
                    {/* Document Type */}
                    <div>
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select
                        disabled={isLoading}
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
                    
                    {/* Facility */}
                    <div>
                      <Label htmlFor="facility">Facility</Label>
                      <div className="text-sm text-gray-700 py-2 px-3 border rounded-md bg-gray-50">
                        {facilityName ? `Facility Name: ${facilityName}` : 'No facility selected'}
                      </div>
                    </div>
                    
                    {/* Compliance Concern */}
                    <div>
                      <Label htmlFor="compliance-concern">Compliance Concern</Label>
                      <Select
                        disabled={isLoading}
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
                    
                    {/* Other Compliance Concern */}
                    {categorization.compliance_concern === 'other' && (
                      <div>
                        <Label htmlFor="compliance-concern-other">Specify Other Compliance Concern</Label>
                        <Input
                          id="compliance-concern-other"
                          value={categorization.compliance_concern_other || ''}
                          onChange={(e) => setCategorization({ 
                            ...categorization, 
                            compliance_concern_other: e.target.value 
                          })}
                          disabled={isLoading}
                          placeholder="Enter compliance concern"
                        />
                      </div>
                    )}
                    
                    {/* Tags */}
                    <div>
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
                          disabled={isLoading}
                          placeholder="Add tags"
                          className="flex-1"
                        />
                        <Button 
                          onClick={addTag} 
                          disabled={isLoading || !tagInput.trim()}
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
                              disabled={isLoading}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-between">
              <Button 
                onClick={onClose} 
                disabled={isLoading}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  )
}
