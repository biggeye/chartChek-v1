/**
 * User Document Types
 * These types represent the user documents infrastructure
 */

/**
 * UserDocument represents a document in the user's document collection
 */
export interface UserDocument {
  document_id: string;
  account_id: string;
  facility_id?: string;
  patient_id?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: bigint;
  bucket: string;
  document_type?: string;
  compliance_concern?: string;
  compliance_concern_other?: string;
  tags?: string[];
  metadata: Record<string, any>;
  openai_file_id?: string;
  gemini_file_id?: string;
  has_embeddings: boolean;
  embedding_model?: string;
  processing_status: string;
  processing_error?: string;
  extracted_text?: string;
  content_summary?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
  is_deleted: boolean;
  title: string;
}

/**
 * Document categorization interface
 */
export interface DocumentCategorization {
  facility_id?: string; // UUID in the database
  patient_id?: string;
  document_type?: string;
  compliance_concern?: string;
  compliance_concern_other?: string;
  tags?: string[];
}

/**
 * UserDocumentStoreState represents the state of the user document store
 */
export interface UserDocumentStoreState {
  documents: UserDocument[];
  isLoadingDocuments: boolean;
  error: string | null;
  
  setDocuments: (documents: UserDocument[]) => void;
  setIsLoadingDocuments: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  fetchDocuments: (facilityId?: string) => Promise<UserDocument[]>;
  fetchDocumentsForCurrentFacility: () => Promise<UserDocument[]>;
  fetchDocumentById: (documentId: string) => Promise<UserDocument | null>;
  
  uploadDocument: (file: File, categorization?: DocumentCategorization) => Promise<UserDocument | null>;
  uploadAndProcessDocument: (file: File, categorization?: DocumentCategorization) => Promise<UserDocument | null>;
  updateDocumentCategorization: (documentId: string, categorization: DocumentCategorization) => Promise<boolean>;
}

export interface DocumentUploadMetadata {
  document_type?: string;
  compliance_concern?: string;
  compliance_concern_other?: string;
  tags?: string[];
  facility_id?: string;
  patient_id?: string;
  [key: string]: any;
}
