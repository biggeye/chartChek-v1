interface SidebarStoreState {
  sidebarCollapsed: boolean;
}

interface SidebarStore {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export type {
  SidebarStoreState,
  SidebarStore
}
