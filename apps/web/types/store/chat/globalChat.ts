// types/store/chat/globalChat.ts
import { LLMOption } from "~/lib/llm-service";
import { TrainingDataset } from "~/types/trainingDatasets";
import { KipuPatientEvaluation } from "~/types/kipu/kipuAdapter";

// Define ChatMessage Interface here for shared use
export interface ChatMessage {
  id?: string; // Optional: If messages get unique IDs later
  role: "user" | "assistant" | "system" | "error"; // Added error role
  content: string;
}

export interface AggregatedContext {
  recordId: string;
  recordType: string;
  recordName: string;
  recordData: any; // Consider defining a more specific union type if possible
  recordMetadata: any[]; // Consider defining a more specific type
}

// Main State Interface
export interface GlobalChatState {
  error: string | null;
  // Context Selection State
  selectedPatient: Patient | null;
  selectedEvaluations: PatientRecord[];
  selectedDocuments: Document[];

  // Queue & Upload State
  queueItems: QueueItem[];
  uploadFiles: UploadFile[];
  isUploading: boolean;

  // Context Aggregation (Review if needed alongside dynamic building)
  aggregatedContext: AggregatedContext[];

  // Chat Core State
  assistantId: string; // For specific OpenAI assistant interactions if needed later
  messages: ChatMessage[];
  isGenerating: boolean;
  isTyping: boolean;
  currentMessage: string;
  isFullScreen: boolean;
  currentThreadId: string | null; // Allow null

  // LLM Configuration State
  availableModels: LLMOption[];
  selectedModel: LLMOption;
  availableTrainingDatasets: TrainingDataset[];
  selectedTrainingDataset: TrainingDataset;

  // --- Actions ---

  // Queue Actions
  selectQueueItem: (record: any) => void; // TODO: Define a union type for record?
  deselectQueueItem: (queueId: string) => void; // Changed param name/type
  clearQueue: () => void;

  // Upload Actions
  addFilesToUpload: (files: FileList) => void; // Changed param type
  processUploadFiles: () => Promise<void>;
  removeUploadFile: (fileId: string) => void;
  clearUploadFiles: () => void;

  // Thread & Message Actions
  createNewThread: () => Promise<string | null>; // Updated return type
  setCurrentThreadId: (threadId: string | null) => void; // Allow null
  sendMessage: () => Promise<void>; // Added sendMessage signature
  sendMessageToSupabase: (
    role: string,
    content: string,
    threadId: string
  ) => Promise<any>; // Updated return type (use specific type if known)
  setMessages: (messages: ChatMessage[]) => void;
  setCurrentMessage: (message: string) => void;

  // UI Actions
  toggleFullScreen: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsTyping: (isTyping: boolean) => void;
  // Configuration Actions
  setSelectedModel: (model: LLMOption) => void;
  setSelectedTrainingDataset: (dataset: TrainingDataset) => void;

  // Context Aggregation Action (Review if needed)
  setAggregatedContext: (
    selectedRecords: any[],
    selectedTrainingDataset: TrainingDataset
  ) => void;
}

// --- Supporting Types ---

// Patient Types
export interface Patient {
  patientId: string; // Composite ID: chartId:patientMasterId
  mrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  status?: string;
  admissionDate?: string;
  dischargeDate?: string;
  facilityId?: string; // Corresponds to Kipu Location ID
}

export interface PatientRecord {
  id: string; // e.g., Evaluation ID, Appointment ID
  patientId: string; // Composite ID for linking
  type: "appointment" | "patientEvaluation" | "order" | string; // Add other types as needed
  date?: string;
  title?: string;
  provider?: string;
  summary?: string;
  // Include specific data structures if needed, e.g.:
  patientEvaluation?: KipuPatientEvaluation; // Link to detailed evaluation type
}

// Document Types
export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "image" | "report" | string; // Allow other types
  category: "clinical" | "administrative" | "billing" | string; // Allow other categories
  dateCreated: string;
  size: number; // in bytes
  // Add source/upload info if relevant
  source?: string; // e.g., 'upload', 'kipu-api'
  kipuDocumentId?: string; // If sourced from Kipu
}

// File Upload Types
export interface UploadFile {
  id: string; // Unique ID for the upload instance
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error"; // Changed 'success' to 'completed'
  name?: string; // Keep original file name
  error?: string; // Store error message if upload fails
}

// Queue Item Types (Represents items staged for context)
export interface QueueItem {
  queueId: string; // Unique ID for the item *in the queue*
  id: string; // ID of the underlying Patient, Document, Eval, etc.
  name: string; // Display name for the queue item
  type?: "file" | "patient" | "document" | "eval"; // Added 'eval', clarify 'file' vs 'document'
  // Consider making data non-optional or refining the type union
  data?: Patient | PatientRecord | Document | UploadFile | KipuPatientEvaluation;
}