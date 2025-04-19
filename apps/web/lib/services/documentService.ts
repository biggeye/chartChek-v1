import { createClient } from '~/utils/supabase/client';
import { Document, DocumentCategorization } from '~/types/store/doc/document';
import { useFacilityStore } from '~/store/patient/facilityStore';

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
      let query = supabase.from('documents').select('*');

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
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record in database
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert([
          {
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            user_id: userId,
            bucket: 'documents',
            patient_id: categorization?.patient_id,
            compliance_concern: categorization?.compliance_concern,
            compliance_concern_other: categorization?.compliance_concern_other,
            processing_status: 'pending'
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
   * Upload and process a document (upload to storage and OpenAI)
   */
  async uploadAndProcessDocument(file: File, categorization?: DocumentCategorization): Promise<Document | null> {
    try {
      // First upload the document to storage
      const document = await this.uploadDocument(file, categorization);

      if (!document) {
        throw new Error('Failed to upload document');
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);

      // Send the file to the OpenAI files API using FormData
      const openAIfileResponse = await fetch('/api/openai/files', {
        method: 'POST',
        body: formData
      });

      if (!openAIfileResponse.ok) {
        const errorText = await openAIfileResponse.text();
        throw new Error(`Failed to upload file to OpenAI: ${errorText}`);
      }

      const openAIfileData = await openAIfileResponse.json();

      // Update the document with the OpenAI file ID
      if (openAIfileData.file_id && document.document_id) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            openai_file_id: openAIfileData.file_id,
            processing_status: 'processed'
          })
          .eq('document_id', document.document_id);

        if (updateError) {
          console.error('Error updating document with OpenAI file ID:', updateError);
          throw updateError;
        }
      }

      // Return the updated document
      return document;
    } catch (error) {
      console.error('Error in uploadAndProcessDocument:', error);
      throw error;
    }
  },

  /**
   * Update document categorization
   */
  async updateDocumentCategorization(documentId: string, categorization: DocumentCategorization): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          facility_id: categorization.facility_id,
          patient_id: categorization.patient_id,
          compliance_concern: categorization.compliance_concern,
          compliance_concern_other: categorization.compliance_concern_other
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
