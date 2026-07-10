'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, LayoutGrid, Check } from 'lucide-react';
import { useWorkspacesQuery } from '@/hooks/use-workspaces';
import { useWorkspaceStore } from '@/store/workspace-store';
import CreateWorkspaceModal from './create-workspace-modal';

export function WorkspaceSwitcher() {
  const { data: workspaces, isLoading } = useWorkspacesQuery();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeWorkspace = workspaces?.find((w) => w._id === currentWorkspaceId);

  // If no workspace is selected, but workspaces are loaded, auto-select the first one
  React.useEffect(() => {
    if (workspaces && workspaces.length > 0 && !currentWorkspaceId) {
      setCurrentWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspaceId]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-md border border-border bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors select-none text-white"
        disabled={isLoading}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <div className="h-5 w-5 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {activeWorkspace?.name.charAt(0) || <LayoutGrid className="h-3 w-3" />}
          </div>
          <span className="truncate">
            {activeWorkspace?.name || (isLoading ? 'Loading...' : 'Select Workspace')}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1.5 w-full min-w-[200px] rounded-lg border border-border bg-zinc-900 p-1.5 shadow-xl z-40">
            <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Workspaces
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-0.5 mt-1">
              {workspaces?.map((workspace) => {
                const isActive = workspace._id === currentWorkspaceId;
                return (
                  <button
                    key={workspace._id}
                    onClick={() => {
                      setCurrentWorkspaceId(workspace._id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{workspace.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>

            <hr className="border-border my-1.5" />

            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 w-full px-2 py-1.5 rounded-md text-xs font-medium text-left text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Workspace</span>
            </button>
          </div>
        </>
      )}

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default WorkspaceSwitcher;
