'use client'

import { useState, useEffect } from 'react'
import { Button } from '@kit/ui/button'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Transition } from '@headlessui/react'
import { Label } from '@kit/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@kit/ui/select'
import { Input } from '@kit/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@kit/ui/dialog'
import { useFacilityStore } from '~/store/patient/facilityStore'
import { createClient } from '~/utils/supabase/client'
import { logger } from '~/lib/logger'
import { useUserDocuments } from '~/hooks/useUserDocuments'
import { DocumentUploadMetadata } from '~/types/store/doc/userDocument'

// Initialize Supabase client
const supabase = createClient();

interface UserDocumentUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  facilityId?: string
  patientId?: string
}

const DOCUMENT_TYPES = [
  'Clinical Assessment',
  'Progress Note',
  'Treatment Plan',
  'Discharge Summary',
  'Lab Report',
  'Other'
] as const;

const COMPLIANCE_CONCERNS = [
  'HIPAA',
  'Joint Commission',
  'DHCS',
  'Other',
  'None'
] as const;

export default function UserDocumentUploadDialog({
  isOpen,
  onClose,
  onSuccess,
  facilityId,
  patientId
}: UserDocumentUploadDialogProps) {
  logger.info('[UserDocumentUploadDialog] Initializing dialog', { isOpen })

  const { uploadDocument, isUploading } = useUserDocuments();
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<string>('')
  const [complianceConcern, setComplianceConcern] = useState<string>('None')
  const [complianceConcernOther, setComplianceConcernOther] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug('[UserDocumentUploadDialog] File input change event triggered')
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      logger.info('[UserDocumentUploadDialog] File selected', {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      })
      setFile(selectedFile)
      // Use filename (without extension) as default title if not set
      if (!title) {
        setTitle(selectedFile.name.split('.').slice(0, -1).join('.'))
      }
    } else {
      logger.warn('[UserDocumentUploadDialog] No file selected from input')
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const metadata: DocumentUploadMetadata = {
        document_type: documentType,
        compliance_concern: complianceConcern,
        compliance_concern_other: complianceConcern === 'Other' ? complianceConcernOther : undefined,
        tags,
        facility_id: facilityId,
        patient_id: patientId,
        title
      };

      await uploadDocument({ file, metadata });
      onSuccess?.();
      handleClose();
    } catch (error) {
      logger.error('[UserDocumentUploadDialog] Error in handleSubmit:', error);
    }
  }

  const handleClose = () => {
    logger.info('[UserDocumentUploadDialog] Closing dialog')
    setFile(null)
    setTitle('')
    setDocumentType('')
    setComplianceConcern('None')
    setComplianceConcernOther('')
    setTags([])
    onClose()
  }

  // Log dialog state changes
  useEffect(() => {
    logger.debug('[UserDocumentUploadDialog] Dialog state changed', { 
      isOpen,
      isUploading,
      hasFile: !!file
    })
  }, [isOpen, isUploading, file])

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
          onClick={handleClose}
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
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-grow">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.doc,.docx"
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Document Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Select value={documentType} onValueChange={setDocumentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={complianceConcern} onValueChange={setComplianceConcern}>
                    <SelectTrigger>
                      <SelectValue placeholder="Compliance Concern" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLIANCE_CONCERNS.map((concern) => (
                        <SelectItem key={concern} value={concern}>
                          {concern}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {complianceConcern === 'Other' && (
                  <div>
                    <Input
                      placeholder="Specify Compliance Concern"
                      value={complianceConcernOther}
                      onChange={(e) => setComplianceConcernOther(e.target.value)}
                      required
                    />
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!file || isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  )
}
