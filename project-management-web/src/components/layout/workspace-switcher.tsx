'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Check, Settings } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useWorkspacesQuery } from '@/hooks/use-workspaces';
import { useSidebar } from './sidebar-context';
import { CreateWorkspaceModal } from '@/features/workspaces/components/create-workspace-modal';

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isCollapsed } = useSidebar();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore();
  const { data: workspaces, isLoading } = useWorkspacesQuery();

  const currentWorkspace = workspaces?.find((ws: any) => ws._id === currentWorkspaceId);

  // Auto-select first workspace if none selected
  React.useEffect(() => {
    if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
      setCurrentWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspaceId]);

  const handleSelect = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    setIsOpen(false);
  };

  const handleCreateClick = () => {
    setIsOpen(false);
    setShowCreateModal(true);
  };

  if (isCollapsed) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 w-9 mx-auto rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold"
          title={currentWorkspace?.name || 'Workspace'}
        >
          {currentWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
        </button>
        <CreateWorkspaceModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full h-9 px-2 rounded-lg hover:bg-secondary transition-colors gap-2"
        >
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
            {currentWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground truncate">
              {isLoading ? 'Loading...' : (currentWorkspace?.name || 'Select Workspace')}
            </p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
              <div className="py-1 max-h-[240px] overflow-y-auto">
                {workspaces?.map((ws: any) => (
                  <button
                    key={ws._id}
                    onClick={() => handleSelect(ws._id)}
                    className="flex items-center w-full px-3 py-2 text-sm hover:bg-secondary transition-colors gap-2"
                  >
                    <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                      {ws.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="flex-1 text-left text-foreground truncate">{ws.name}</span>
                    {ws._id === currentWorkspaceId && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={handleCreateClick}
                  className="flex items-center w-full px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Workspace</span>
                </button>
                <a
                  href="/settings/workspace"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center w-full px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors gap-2"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Workspace Settings</span>
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
