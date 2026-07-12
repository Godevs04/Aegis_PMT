'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, FolderKanban, ArrowLeft, LayoutGrid, List, Table } from 'lucide-react';
import Link from 'next/link';
import { useProjectQuery } from '@/hooks/use-projects';
import { KanbanBoard } from '@/features/board/components/kanban-board';
import { ListView } from '@/features/board/components/list-view';
import { TableView } from '@/features/board/components/table-view';

type ViewMode = 'board' | 'list' | 'table';

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  const { data: project, isLoading } = useProjectQuery(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Project not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The project may have been deleted or you don&apos;t have access.
        </p>
        <Link href="/projects" className="text-sm text-primary hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Project Header */}
      <div className="px-6 py-4 border-b border-border bg-card/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-foreground truncate">{project.name}</h1>
                <p className="text-[10px] font-mono text-muted-foreground">{project.prefix}</p>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Board view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table view"
            >
              <Table className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden px-6 pt-4">
        {viewMode === 'board' && (
          <KanbanBoard projectId={projectId} projectPrefix={project.prefix} />
        )}
        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto">
            <ListView projectId={projectId} projectPrefix={project.prefix} />
          </div>
        )}
        {viewMode === 'table' && (
          <div className="h-full overflow-y-auto">
            <TableView projectId={projectId} projectPrefix={project.prefix} />
          </div>
        )}
      </div>
    </div>
  );
}
