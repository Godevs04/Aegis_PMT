import { create } from 'zustand';

interface WorkspaceStoreState {
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  currentWorkspaceId: typeof window !== 'undefined' ? localStorage.getItem('active_workspace_id') : null,
  setCurrentWorkspaceId: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('active_workspace_id', id);
      } else {
        localStorage.removeItem('active_workspace_id');
      }
    }
    set({ currentWorkspaceId: id });
  },
}));

export default useWorkspaceStore;
