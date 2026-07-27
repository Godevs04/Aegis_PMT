import { create } from 'zustand';

interface Workspace {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
}

const WORKSPACE_ID_KEY = 'active_workspace_id';
const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

/** Only accept a plain Mongo ObjectId string — never a stringified object. */
function normalizeWorkspaceId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (OBJECT_ID_RE.test(trimmed)) return trimmed;
  // Recover id if something previously wrote a bad stringified object
  const match = trimmed.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
}

function readStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(WORKSPACE_ID_KEY);
  const id = normalizeWorkspaceId(raw);
  if (raw && !id) {
    localStorage.removeItem(WORKSPACE_ID_KEY);
  } else if (raw && id && raw !== id) {
    localStorage.setItem(WORKSPACE_ID_KEY, id);
  }
  return id;
}

interface WorkspaceStoreState {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  currentWorkspaceId: readStoredWorkspaceId(),
  currentWorkspace: null,

  setCurrentWorkspaceId: (id) => {
    const normalized = id ? normalizeWorkspaceId(id) : null;
    if (typeof window !== 'undefined') {
      if (normalized) {
        localStorage.setItem(WORKSPACE_ID_KEY, normalized);
      } else {
        localStorage.removeItem(WORKSPACE_ID_KEY);
      }
    }
    set({ currentWorkspaceId: normalized });
  },

  setCurrentWorkspace: (workspace) => {
    const id = workspace ? normalizeWorkspaceId(workspace._id) : null;
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(WORKSPACE_ID_KEY, id);
      else localStorage.removeItem(WORKSPACE_ID_KEY);
    }
    set({ currentWorkspace: workspace, currentWorkspaceId: id });
  },
}));

export default useWorkspaceStore;
