import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { KipuEvaluationItemObject as EvaluationDetail } from "types/kipu/kipuAdapter"
import { PatientEvaluationParserService } from "~/lib/parse-evaluation"
import type { ContextItem, EvaluationContextItem, PatientEvaluationItem } from "types/chat"
import { createClient } from "~/utils/supabase/client"

interface ContextQueueState {
  items: ContextItem[]
  // Actions
  addItem: (item: Omit<ContextItem, "id" | "createdAt" | "selected">) => void
  removeItem: (itemId: string) => void
  toggleItem: (itemId: string, selected: boolean) => void
  toggleEvaluationItemDetail: (itemId: string, detailId: string, selected: boolean) => void
  clearQueue: () => void

  // Getters
  getSelectedItems: () => ContextItem[]
  getSelectedContent: () => string | undefined

  // Supabase queue integration
  storeContextInQueue: (threadId: string, customContent?: string) => Promise<any>
  getContextFromQueue: (threadId: string) => Promise<string>
}

export const useContextQueueStore = create<ContextQueueState>()((set, get) => ({
  items: [],

  addItem: (item) => {
    const newItem: ContextItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date(),
      selected: true,
    } as ContextItem

    set((state) => ({
      items: [...state.items, newItem],
    }))
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }))
  },

  toggleItem: (itemId, selected) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === itemId ? { ...item, selected } : item)),
    }))
  },

  toggleEvaluationItemDetail: (itemId, detailId, selected) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId && item.type === "evaluation"
          ? {
              ...item,
              details: (item as EvaluationContextItem).details.map((detail: PatientEvaluationItem) =>
                detail.id.toString() === detailId ? { ...detail, selected: selected } : detail,
              ),
            }
          : item,
      ),
    }))
  },

  clearQueue: () => {
    set({ items: [] })
  },

  getSelectedItems: () => {
    return get().items.filter((item) => item.selected)
  },

  getSelectedContent: (): string | undefined => {
    const items = get().items.filter((item) => item.selected)
    
    if (items.length === 0) {
      return undefined;
    }

    const parser = new PatientEvaluationParserService()
    
    const contentArray = items.map((item): string => {
      if (item.type === "evaluation") {
        const parsedContent = parser.parseEvaluation(item as any);
        return `EVALUATION: ${item.title}\n${parsedContent}`
      }

      if (!item.content) {
        return `${item.type.toUpperCase()}: ${item.title}\n[No content available]`;
      }
      
      return `${item.type.toUpperCase()}: ${item.title}\n${item.content}`;
    });
  
    return contentArray.join("\n\n");
  },

  // Store processed context in Supabase context_items table
  storeContextInQueue: async (threadId: string, customContent?: string) => {
    try {
      // Validate threadId
      if (!threadId || typeof threadId !== 'string') {
        console.warn("Invalid threadId provided for storing context:", threadId);
        throw new Error("Invalid thread ID");
      }
      
      console.log("Storing context for thread ID:", threadId);
      // Use custom content if provided, otherwise get selected content
      const contextContent = customContent || get().getSelectedContent();
      const supabaseClient = createClient();
      const { data: userData } = await supabaseClient.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      // Create properly structured metadata object
      const metadata = { thread_id: threadId };
      
      const { data, error } = await supabaseClient
        .from('context_items')
        .insert([
          { 
            content: contextContent,
            title: `Thread ${threadId} Context`,
            type: "document",
            account_id: userData.user.id,
            metadata: metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error("Error inserting context:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error storing context in queue:", error);
      throw error;
    }
  },

  // Retrieve context from Supabase context_items for a specific thread
  getContextFromQueue: async (threadId: string) => {
    try {
      const supabaseClient = createClient();
      
      // Log the threadId for debugging
      console.log("Getting context for thread ID:", threadId);
      
      // First check if the threadId is valid
      if (!threadId || typeof threadId !== 'string') {
        console.warn("Invalid threadId provided:", threadId);
        return '';
      }
      
      // Use a more reliable approach for JSON field querying
      const { data, error } = await supabaseClient
        .from('context_items')
        .select('content')
        .filter('metadata', 'cs', JSON.stringify({ thread_id: threadId }))
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }
      
      // Check if we got any results
      if (data?.length > 0) {
        return data[0]?.content || '';
      }
      
      return '';
    } catch (error) {
      console.error("Error retrieving context from queue:", error);
      return '';
    }
  },
}))
