import * as z from 'zod';

  
  interface DocumentMetadata {
    notes: string;
    tags: string[];
    category: string;
  }

  // Compliance concern types
  type ComplianceConcernType = 'jco' | 'dhcs' | 'carf' | 'other' | '';
  
  // Document categorization interface
 export interface DocumentCategorization {
    facility_id?: string;
    patient_id?: string;
    category?: string;
  }

  
  
 export interface Document {
    document_id: string;
    facility_id?: string;
    patient_id?: string;
    compliance_concern?: ComplianceConcernType;
    compliance_concern_other?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    file_path: z.infer<typeof filePathSchema>;
    bucket?: string;
    created_at?: string;
    updated_at?: string;
    account_id?: string;
    processing_status?: 'pending' | 'processing' | 'indexed' | 'failed' | 'unsupported_format' | string;
    processing_error?: string;
    metadata?: DocumentMetadata[];
    openai_file_id?: string;
    has_embeddings?: boolean;
  }

const filePathSchema = z.string().min(1);

export interface DocumentStoreState {
  documents: Document[];
  isLoadingDocuments: boolean;
  error: string | null;
 
  setDocuments: (documents: Document[]) => void;
  setIsLoadingDocuments: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
 
  // Document conversion helpers
  getUserDocuments: () => Document[];
  
  fetchDocuments: (facilityId?: string) => Promise<Document[]>;
  fetchDocumentsForCurrentFacility: () => Promise<Document[]>;
 
  uploadDocument: (file: File, categorization?: DocumentCategorization) => Promise<Document | null>;
  uploadAndProcessDocument: (file: File, categorization?: DocumentCategorization) => Promise<Document | null>;
  updateDocumentCategorization: (documentId: string, categorization: DocumentCategorization) => Promise<boolean>;
  detectPDFAndExtractText: (file: File) => Promise<string | null>;
  fetchTrainingData: (metadataId: string) => Promise<string>;
}


interface DocumentSearchResult {
  // Add properties for DocumentSearchResult here
}
