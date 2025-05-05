import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { KipuEvaluationItemObject as EvaluationDetail } from "types/kipu/kipuAdapter"
import { PatientEvaluationParserService } from "~/lib/parse-evaluation"
import type { ContextItem, EvaluationContextItem, PatientEvaluationItem } from "types/chat"
import { createClient } from "~/utils/supabase/client"
import { useChatStore } from "./chatStore"

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

  // Supabase context management
  storeContextInSession: (sessionId: string) => Promise<void>
  loadContextFromSession: (sessionId: string) => Promise<void>
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

  // Store selected context items in Supabase for a chat session
  storeContextInSession: async (sessionId: string) => {
    try {
      const supabaseClient = createClient();
      const { data: userData } = await supabaseClient.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }

      const selectedItems = get().getSelectedItems();
      const formattedContent = get().getSelectedContent();

      if (!formattedContent || selectedItems.length === 0) {
        console.log("No context items to store");
        return;
      }

      // First store the combined context as a single item
      const { data: contextItem, error: contextError } = await supabaseClient
        .from('context_items')
        .insert([
          {
            type: "document", 
            title: `Session ${sessionId} Context`,
            content: formattedContent,
            account_id: userData.user.id,
            metadata: {
              session_id: sessionId,
              source: "combined_context",
              item_count: selectedItems.length
            }
          }
        ])
        .select('id')
        .single();

      if (contextError) {
        throw contextError;
      }

      // Then link it to the session
      const { error: linkError } = await supabaseClient
        .from('session_context')
        .insert([
          {
            session_id: sessionId,
            context_item_id: contextItem.id
          }
        ]);

      if (linkError) {
        throw linkError;
      }

      console.log(`[ContextQueue] Stored ${selectedItems.length} items for session ${sessionId}`);
    } catch (error) {
      console.error("[ContextQueue] Error storing context:", error);
      throw error;
    }
  },

  // Load context items for a chat session from Supabase
  loadContextFromSession: async (sessionId: string) => {
    try {
      const supabaseClient = createClient();
      
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        console.error("[ContextQueue] Authentication error:", authError);
        return;
      }
      
      // Get all context items for this session
      const { data: contextItems, error } = await supabaseClient
        .from('context_items')
        .select('*')
        .eq('metadata->session_id', sessionId)
        .eq('account_id', user.id) // Add user filter
        .order('created_at', { ascending: true });

      if (error) {
        console.error("[ContextQueue] Error querying context:", error);
        return; // Don't throw, just return since no context is a valid state
      }

      if (!contextItems?.length) {
        console.log(`[ContextQueue] No context found for session ${sessionId}`);
        set({ items: [] }); // Explicitly set empty array to clear any existing items
        return;
      }

      // Convert Supabase items to ContextItems and add to queue
      const processedItems = contextItems.map(item => {
        try {
          const baseItem = {
            id: item.id,
            type: item.type as "document" | "evaluation" | "upload",
            title: item.title,
            content: item.content,
            createdAt: new Date(item.created_at),
            selected: true,
          };

          // If it's an evaluation, add the required evaluation fields
          if (item.type === "evaluation") {
            const metadata = item.metadata as any;
            return {
              ...baseItem,
              patientId: metadata.patientId || "",
              evaluationId: metadata.evaluationId || "",
              evaluationDate: new Date(metadata.evaluationDate || Date.now()),
              evaluationType: metadata.evaluationType || "Unknown",
              details: metadata.details || [],
              severity: metadata.severity || "medium"
            } as EvaluationContextItem;
          }

          return baseItem as ContextItem;
        } catch (itemError) {
          console.error(`[ContextQueue] Error processing item ${item.id}:`, itemError);
          return null; // Skip malformed items
        }
      });

      // Filter out null items and ensure type safety
      const validItems = processedItems.filter((item): item is ContextItem => item !== null);

      set({ items: validItems });
      console.log(`[ContextQueue] Loaded ${validItems.length} items for session ${sessionId}`);
    } catch (error) {
      console.error("[ContextQueue] Error loading context:", error);
      set({ items: [] }); // Reset items on error to ensure clean state
    }
  }
}));
