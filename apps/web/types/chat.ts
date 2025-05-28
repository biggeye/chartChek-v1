import type { ReactNode } from "react"
import { KipuFieldTypes, KipuPatientEvaluationItem } from "./kipu/kipuAdapter"

export type ModelProvider = "openai" | "google" | "anthropic" | "custom"

export interface ModelConfig {
  provider: ModelProvider
  modelName: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
  context?: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  modelConfig: ModelConfig
  createdAt: Date
  updatedAt: Date
}

export type ContextItemType = "document" | "upload" | "evaluation" | "context"

export interface BaseContextItem {
  id: string
  type: ContextItemType
  title: string
  content: string
  createdAt: Date
  selected: boolean
}

export interface DocumentContextItem extends BaseContextItem {
  type: ContextItemType
  fileUrl: string
  fileType: string
  fileSize: number
}

export interface UploadContextItem extends BaseContextItem {
  type: "upload"
  fileUrl: string
  fileType: string
  fileSize: number
}

export interface PatientEvaluationItem {
  id: number;
  fieldType: KipuFieldTypes;
  name: string;
  recordNames: string;
  columnNames: string;
  label: string;
  optional: boolean;
  evaluationId: number;
  defaultValue: string;
  dividerBelow: boolean;
  rule: string;
  placeholder: string;
  prePopulateWithId: number;
  parentItemId: string;
  conditions: string;
  labelWidth: string;
  itemGroup: string;
  showString: string;
  showStringCss: string;
  matrixDefaultRecords: number;
  cssStyle: string;
  image?: string;
  skipValidations?: boolean;
  records: any[];
}

export interface EvaluationContextItem extends BaseContextItem {
  type: "evaluation"
  patientId: string
  evaluationId: string
  evaluationDate: Date
  evaluationType: string
  details: PatientEvaluationItem[]
}

export type ContextItem = DocumentContextItem | UploadContextItem | EvaluationContextItem

export interface ChatUIProps {
  session: ChatSession
  contextItems: ContextItem[]
  isLoading?: boolean
  onSendMessage: (message: string) => void
  onSelectModel: (config: ModelConfig) => void
  onAddContextItem: (item: ContextItem) => void
  onRemoveContextItem: (itemId: string) => void
  onToggleContextItem: (itemId: string, selected: boolean) => void
  onToggleEvaluationSection?: (itemId: string, sectionId: string, selected: boolean) => void
  onClearContext: () => void
  renderContextItem?: (item: ContextItem) => ReactNode
}

/**
 * Database types for the chat system
 * These types match the SQL schema defined in migrations/chat_schema.sql
 */

export type ConversationStatus = 'active' | 'archived' | 'deleted';
export type MessageRole = 'user' | 'assistant' | 'system'; // Note: Matches existing Message.role
export type DbContextItemType = 'patient' | 'document' | 'note' | 'custom'; // Renamed to avoid conflict

export interface DbModelConfig { // Renamed to avoid conflict
  provider: string;
  modelName: string;
}

export interface DbConversation { // Renamed to avoid conflict
  id: string;
  title: string | null;
  account_id: string;
  model_config: DbModelConfig; // Use renamed type
  status: ConversationStatus;
  context_items: DbContextItem[]; // Use renamed type
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface DbMessage { // Renamed to avoid conflict
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number | null;
  context_snapshot: Record<string, any> | null;
  created_at: string;
}

export interface DbContextItem { // Renamed to avoid conflict
  id: string;
  type: DbContextItemType; // Use renamed type
  title: string;
  content: string;
  metadata: Record<string, any> | null;
  account_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationContext {
  conversation_id: string;
  context_item_id: string;
  added_at: string;
}

/**
 * Database service interfaces
 */

export interface ConversationService {
  createConversation(title?: string, modelConfig?: Partial<DbModelConfig>, userId?: string): Promise<string>; // Use renamed type
  getConversation(id: string): Promise<DbConversation | null>; // Use renamed type
  listConversations(limit?: number, offset?: number): Promise<DbConversation[]>; // Use renamed type
  updateConversation(id: string, data: Partial<DbConversation>): Promise<void>; // Use renamed type
  deleteConversation(id: string): Promise<void>;
  archiveConversation(id: string): Promise<void>;
  updateModelSelection(id: string, modelId: string): Promise<void>;
}

export interface MessageService {
  createMessage(conversationId: string, role: MessageRole, content: string, userId?: string): Promise<string>;
  getMessages(conversationId: string): Promise<DbMessage[]>; // Use renamed type
  getMessageById(id: string): Promise<DbMessage | null>; // Use renamed type
}

export interface ContextItemService {
  createContextItem(type: DbContextItemType, title: string, content: string, metadata?: Record<string, any>): Promise<string>; // Use renamed type
  getContextItem(id: string): Promise<DbContextItem | null>; // Use renamed type
  listContextItems(type?: DbContextItemType): Promise<DbContextItem[]>; // Use renamed type
  attachToConversation(conversationId: string, contextItemId: string): Promise<void>;
  detachFromConversation(conversationId: string, contextItemId: string): Promise<void>;
  getConversationContextItems(conversationId: string): Promise<DbContextItem[]>; // Use renamed type
}
