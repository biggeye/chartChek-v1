import { createClient } from '~/utils/supabase/client';
import { Document, DocumentCategorization } from '~/types/store/doc/document';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { UserDocument, DocumentUploadMetadata } from '~/types/store/doc/userDocument';
import { logger } from '~/lib/logger';

// Initialize Supabase client
const supabase = createClient();

/**
 * Document Service - Handles all document-related operations with external services
 */
export const documentService = {

  /**
   * Fetch all documents or documents for a specific facility
   */
  async fetchDocuments(facilityId?: number): Promise<Document[]> {
    try {
      // Build query
      let query = supabase.from('user_documents').select('*');

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      if (facilityId) {
        return data.filter(doc => doc.facility_id === facilityId) as Document[];
      }
      
      return data as Document[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  /**
   * Fetch documents for the current facility
   */
  async fetchDocumentsForCurrentFacility(): Promise<Document[]> {
    try {
      const currentFacilityId = useFacilityStore.getState().currentFacilityId;

      if (currentFacilityId) {
        return this.fetchDocuments(currentFacilityId);
      }

      return [];
    } catch (error) {
      console.error('Error fetching documents for current facility:', error);
      throw error;
    }
  },

  /**
   * Upload a document to storage
   */
  async uploadDocument(file: File, categorization?: DocumentCategorization): Promise<Document | null> {
    try {
      // Get current facility ID and user ID
      const facilityId = useFacilityStore.getState().currentFacilityId;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const userId = user?.id;

      if (authError) throw authError;

      // Generate a unique file path
      const timestamp = new Date().getTime();
      const file_name = `${timestamp}_${file.name}`;
      const filePath = `${userId}/${file_name}`;

      // Upload file to Supabase storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record in database
      const { data: documentData, error: documentError } = await supabase
        .from('user_documents')
        .insert([
          {
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            category: categorization?.category,
            account_id: userId,
            bucket: 'user_documents',
            patient_id: categorization?.patient_id,
          }
        ])
        .select()
        .single();

      if (documentError) throw documentError;

      return documentData as Document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Update document categorization
   */
  async updateDocumentCategorization(documentId: string, categorization: DocumentCategorization): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_documents')
        .update({
          facility_id: categorization.facility_id,
          patient_id: categorization.patient_id
        })
        .eq('document_id', documentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating document categorization:', error);
      throw error;
    }
  },

  /**
   * Detect if a file is a PDF and extract text
   */
  async detectPDFAndExtractText(file: File): Promise<string | null> {
    // Implementation would go here
    // This is a placeholder for the actual implementation
    return null;
  },

  /**
   * Fetch training data for a document
   */
  async fetchTrainingData(metadataId: string): Promise<string> {
    // Implementation would go here
    // This is a placeholder for the actual implementation
    return '';
  }
};

export async function uploadUserDocument({ 
  file, 
  accountId, 
  metadata 
}: {
  file: File;
  accountId: string;
  metadata: DocumentUploadMetadata;
}): Promise<UserDocument> {
  const supabase = createClient();
  logger.info('[userDocumentService] Starting document upload', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    // 1. Upload file to storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${accountId}/${fileName}`;

    const { data: storageData, error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file);

    if (uploadError) {
      logger.error('[userDocumentService] Storage upload failed:', uploadError);
      throw uploadError;
    }

    // 2. Create document record
    const { data: doc, error: insertError } = await supabase
      .from('user_documents')
      .insert({
        account_id: accountId,
        facility_id: metadata.facility_id,
        patient_id: metadata.patient_id,
        file_name: file.name,
        title: file.name, // Use filename as default title
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        bucket: 'user-documents',
        document_type: metadata.document_type,
        compliance_concern: metadata.compliance_concern,
        compliance_concern_other: metadata.compliance_concern_other,
        tags: metadata.tags || [],
        metadata: metadata,
        processing_status: 'pending',
        has_embeddings: false,
        is_deleted: false
      })
      .select('*')
      .single();

    if (insertError) {
      logger.error('[userDocumentService] Database insert failed:', insertError);
      // Clean up storage file if database insert fails
      await supabase.storage
        .from('user-documents')
        .remove([filePath]);
      throw insertError;
    }

    logger.info('[userDocumentService] Document upload completed successfully', {
      documentId: doc.document_id
    });

    return doc;
  } catch (error) {
    logger.error('[userDocumentService] Upload failed:', error);
    throw error;
  }
}

export async function fetchUserDocuments(accountId: string): Promise<UserDocument[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('account_id', accountId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchUserDocument(documentId: string): Promise<UserDocument> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('document_id', documentId)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserDocument(documentId: string): Promise<boolean> {
  const supabase = createClient();
  
  // First get the document to get the file path
  const { data: doc, error: fetchError } = await supabase
    .from('user_documents')
    .select('file_path')
    .eq('document_id', documentId)
    .single();

  if (fetchError) throw fetchError;

  // Soft delete the document record
  const { error: deleteError } = await supabase
    .from('user_documents')
    .update({ is_deleted: true })
    .eq('document_id', documentId);

  if (deleteError) throw deleteError;

  // Try to delete the file from storage, but don't fail if it doesn't exist
  try {
    await supabase.storage
      .from('user-documents')
      .remove([doc.file_path]);
  } catch (error) {
    logger.warn('[userDocumentService] Failed to delete storage file:', error);
  }

  return true;
}

export async function chunkUserDocument({ documentId, chunkSize, chunkOverlap }: {
  documentId: string;
  chunkSize: number;
  chunkOverlap: number;
}): Promise<{ chunk_count: number; chunk_ids: string[] }> {
  const res = await fetch('/api/documents/chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      document_id: documentId, 
      chunk_size: chunkSize, 
      chunk_overlap: chunkOverlap, 
      type: 'user' 
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Chunking failed' }));
    throw new Error(error.message || 'Chunking failed');
  }

  return await res.json();
}

export async function fetchUserChunks(documentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('position');

  if (error) throw error;
  return data;
}

export async function deleteUserChunks(documentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_document_chunks')
    .delete()
    .eq('document_id', documentId);

  if (error) throw error;
  return true;
}
