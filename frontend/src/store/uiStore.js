import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  currentPage: 'dashboard',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
