'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'


// Define the sidebar store state interface
export interface SidebarStore {
  // State
  isDesktopSidebarCollapsed: boolean;
  
  // Actions
  setIsDesktopSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleSidebar: () => void;
}

// Create the sidebar store
export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isDesktopSidebarCollapsed: false,
      
      setIsDesktopSidebarCollapsed: (isCollapsed) => 
        set({ isDesktopSidebarCollapsed: isCollapsed }),
      
      toggleSidebar: () => 
        set((state) => ({ 
          isDesktopSidebarCollapsed: !state.isDesktopSidebarCollapsed 
        })),
    }),
    {
      name: 'ui-sidebar-storage',
    }
  )
)

export default useSidebarStore
