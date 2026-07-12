import { create } from 'zustand';

interface Workspace {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
}

interface WorkspaceStoreState {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  currentWorkspaceId:
    typeof window !== 'undefined' ? localStorage.getItem('active_workspace_id') : null,
  currentWorkspace: null,

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

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
    if (workspace) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_workspace_id', workspace._id);
      }
      set({ currentWorkspaceId: workspace._id });
    }
  },
}));

export default useWorkspaceStore;
