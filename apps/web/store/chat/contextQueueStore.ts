import { create } from "zustand"

interface ContextQueueItem {
  id: string;
  type: string;
  title: string;
  selected: boolean;
  content?: string;
}

interface ContextQueueState {
  items: ContextQueueItem[];
  addItem: (item: Omit<ContextQueueItem, "selected">) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string, selected: boolean) => void;
  clearQueue: () => void;
  getSelectedIds: () => string[];
}

export const useContextQueueStore = create<ContextQueueState>()((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, { ...item, selected: true }]
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
  toggleItem: (id, selected) => set((state) => ({
    items: state.items.map((item) => item.id === id ? { ...item, selected } : item)
  })),
  clearQueue: () => set({ items: [] }),
  getSelectedIds: () => get().items.filter(i => i.selected).map(i => i.id),
}));
