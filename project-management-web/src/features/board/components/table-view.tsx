'use client';

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus, TaskPriority } from '@/services/task-service';
import { useTasksQuery, useStatusesQuery, usePrioritiesQuery } from '@/hooks/use-tasks';
import { useWorkspaceStore } from '@/store/workspace-store';

interface TableViewProps {
  projectId: string;
  projectPrefix?: string;
  onTaskClick?: (task: Task) => void;
}

export function TableView({ projectId, projectPrefix, onTaskClick }: TableViewProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data: tasksData, isLoading } = useTasksQuery(
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId, projectId, limit: 100, sortBy: 'taskNumber', sortOrder: 'asc' }
      : null
  );

  const tasks: Task[] = tasksData?.data || [];

  const columns: ColumnDef<Task>[] = useMemo(
    () => [
      // Select
      {
        id: 'select',
        header: ({ table }: any) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-primary"
          />
        ),
        cell: ({ row }: any) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e: any) => e.stopPropagation()}
            className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-primary"
          />
        ),
        size: 40,
        enableSorting: false,
      },
      // Task Number
      {
        accessorKey: 'taskNumber',
        header: 'ID',
        cell: ({ row }: any) => (
          <span className="text-[10px] font-mono text-muted-foreground">
            {projectPrefix ? `${projectPrefix}-${row.original.taskNumber}` : `#${row.original.taskNumber}`}
          </span>
        ),
        size: 80,
      },
      // Title
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }: any) => (
          <span className="text-sm font-medium text-foreground truncate block max-w-[300px]">
            {row.original.title}
          </span>
        ),
        size: 300,
      },
      // Status
      {
        accessorKey: 'statusId',
        header: 'Status',
        cell: ({ row }: any) => {
          const status = row.original.statusId as TaskStatus | undefined;
          if (!status || typeof status === 'string') return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-xs text-foreground">{status.name}</span>
            </div>
          );
        },
        size: 120,
      },
      // Priority
      {
        accessorKey: 'priorityId',
        header: 'Priority',
        cell: ({ row }: any) => {
          const priority = row.original.priorityId as TaskPriority | undefined;
          if (!priority || typeof priority === 'string') return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <span className="text-xs font-medium" style={{ color: priority.color }}>
              {priority.name}
            </span>
          );
        },
        size: 100,
      },
      // Assignees
      {
        accessorKey: 'assignees',
        header: 'Assignees',
        cell: ({ row }: any) => {
          const assignees = row.original.assignees || [];
          if (assignees.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex -space-x-1">
              {assignees.slice(0, 3).map((user: any) => (
                <div
                  key={user._id}
                  className="h-5 w-5 rounded-full bg-primary/10 border border-background flex items-center justify-center text-[8px] font-semibold text-primary"
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {assignees.length > 3 && (
                <span className="text-[9px] text-muted-foreground ml-1">+{assignees.length - 3}</span>
              )}
            </div>
          );
        },
        size: 100,
        enableSorting: false,
      },
      // Labels
      {
        accessorKey: 'labels',
        header: 'Labels',
        cell: ({ row }: any) => {
          const labels = row.original.labels || [];
          if (labels.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex gap-1 flex-wrap">
              {labels.slice(0, 2).map((label: any) => (
                <span
                  key={label._id}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{ backgroundColor: `${label.color}20`, color: label.color }}
                >
                  {label.name}
                </span>
              ))}
              {labels.length > 2 && <span className="text-[9px] text-muted-foreground">+{labels.length - 2}</span>}
            </div>
          );
        },
        size: 140,
        enableSorting: false,
      },
      // Due Date
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }: any) => {
          const dueDate = row.original.dueDate;
          if (!dueDate) return <span className="text-xs text-muted-foreground">—</span>;
          const isOverdue = !row.original.completedAt && new Date(dueDate) < new Date();
          return (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          );
        },
        size: 110,
      },
      // Created
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: any) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        ),
        size: 100,
      },
    ],
    [projectPrefix]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Create a task to see it in the table.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id} className="border-b border-border bg-secondary/30">
                  {headerGroup.headers.map((header: any) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="ml-0.5">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {table.getRowModel().rows.map((row: any) => (
                <tr
                  key={row.id}
                  onClick={() => onTaskClick?.(row.original)}
                  className={`
                    border-b border-border/50 hover:bg-secondary/20 cursor-pointer transition-colors
                    ${row.getIsSelected() ? 'bg-primary/5' : ''}
                  `}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2.5"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>{table.getFilteredSelectedRowModel().rows.length} of{' '}</>
          )}
          {table.getFilteredRowModel().rows.length} task(s)
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TableView;
