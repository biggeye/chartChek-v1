'use client';

import { createClient } from '~/utils/supabase/client';
import type { 
  Conversation, 
  ConversationService, 
  ContextItem, 
  ContextItemService, 
  ContextItemType, 
  Message, 
  MessageRole, 
  MessageService,
  ModelConfig
} from '@/types/chat/database';

/**
 * Supabase implementation of the chat services
 */
class SupabaseConversationService implements ConversationService {
  private supabase = createClient();

  async createConversation(title?: string, modelConfig?: Partial<ModelConfig>, userId?: string): Promise<string> {
    const defaultModelConfig = { provider: 'openai', modelName: 'gpt-4o' };
    const config = { ...defaultModelConfig, ...modelConfig };
    
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        title: title || 'New Conversation',
        model_config: config,
        user_id: userId,
      })
      .select('id')
      .single();
    
    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    return data.id;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
    
    return data as Conversation;
  }

  async listConversations(limit = 20, offset = 0): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw new Error(`Failed to list conversations: ${error.message}`);
    return data as Conversation[];
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .update(data)
      .eq('id', id);
    
    if (error) throw new Error(`Failed to update conversation: ${error.message}`);
  }

  async deleteConversation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete conversation: ${error.message}`);
  }

  async archiveConversation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', id);
    
    if (error) throw new Error(`Failed to archive conversation: ${error.message}`);
  }

  async updateModelSelection(id: string, modelId: string): Promise<void> {
    // Parse the model ID to get provider and model name
    const [provider, modelName] = modelId.split(':');
    
    if (!provider || !modelName) {
      throw new Error('Invalid model ID format. Expected "provider:modelName"');
    }
    
    const { error } = await this.supabase
      .from('conversations')
      .update({ 
        model_config: { provider, modelName },
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw new Error(`Failed to update model selection: ${error.message}`);
  }
}

class SupabaseMessageService implements MessageService {
  private supabase = createClient();

  async createMessage(conversationId: string, role: MessageRole, content: string, userId?: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        user_id: userId,
      })
      .select('id')
      .single();
    
    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return data.id;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw new Error(`Failed to get messages: ${error.message}`);
    return data as Message[];
  }

  async getMessageById(id: string): Promise<Message | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get message: ${error.message}`);
    }
    
    return data as Message;
  }
}

class SupabaseContextItemService implements ContextItemService {
  private supabase = createClient();

  async createContextItem(
    type: ContextItemType, 
    title: string, 
    content: string, 
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('context_items')
      .insert({
        type,
        title,
        content,
        metadata,
        user_id: userId || 'anonymous'
      })
      .select('id')
      .single();
    
    if (error) throw new Error(`Failed to create context item: ${error.message}`);
    return data.id;
  }

  async getContextItem(id: string): Promise<ContextItem | null> {
    const { data, error } = await this.supabase
      .from('context_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get context item: ${error.message}`);
    }
    
    return data as ContextItem;
  }

  async listContextItems(type?: ContextItemType): Promise<ContextItem[]> {
    let query = this.supabase
      .from('context_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to list context items: ${error.message}`);
    return data as ContextItem[];
  }

  async attachToConversation(conversationId: string, contextItemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversation_context')
      .insert({
        conversation_id: conversationId,
        context_item_id: contextItemId
      });
    
    if (error) throw new Error(`Failed to attach context item: ${error.message}`);
  }

  async detachFromConversation(conversationId: string, contextItemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversation_context')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('context_item_id', contextItemId);
    
    if (error) throw new Error(`Failed to detach context item: ${error.message}`);
  }

  async getConversationContextItems(conversationId: string): Promise<ContextItem[]> {
    const { data, error } = await this.supabase
      .from('conversation_context')
      .select('context_item_id')
      .eq('conversation_id', conversationId);
    
    if (error) throw new Error(`Failed to get conversation context items: ${error.message}`);
    
    if (data.length === 0) return [];
    
    const contextItemIds = data.map(item => item.context_item_id);
    
    const { data: contextItems, error: contextError } = await this.supabase
      .from('context_items')
      .select('*')
      .in('id', contextItemIds);
    
    if (contextError) throw new Error(`Failed to get context items: ${contextError.message}`);
    return contextItems as ContextItem[];
  }
}

// Export service instances
export const conversationService = new SupabaseConversationService();
export const messageService = new SupabaseMessageService();
export const contextItemService = new SupabaseContextItemService();
