/**
 * Type declaration for @tanstack/react-table
 * This declaration file provides type safety until the package is installed.
 * Run `npm install` to resolve the actual module.
 */
declare module '@tanstack/react-table' {
  import type { ReactNode } from 'react';

  export type ColumnDef<_TData, TValue = unknown> = {
    id?: string;
    accessorKey?: string;
    header?: string | ((props: { table: Table<_TData> }) => ReactNode);
    cell?: (props: { row: Row<_TData> }) => ReactNode;
    size?: number;
    enableSorting?: boolean;
    // TValue reserved for compatibility with @tanstack/react-table generics
    _value?: TValue;
  };

  export type SortingState = Array<{ id: string; desc: boolean }>;
  export type RowSelectionState = Record<string, boolean>;

  export interface Column<_TData> {
    columnDef: ColumnDef<_TData>;
    getCanSort(): boolean;
    getIsSorted(): false | 'asc' | 'desc';
    getToggleSortingHandler(): (() => void) | undefined;
    getSize(): number;
  }

  export interface Cell<_TData> {
    id: string;
    column: Column<_TData>;
    getContext(): unknown;
  }

  export interface Row<_TData> {
    id: string;
    original: _TData;
    getIsSelected(): boolean;
    getToggleSelectedHandler(): (event: unknown) => void;
    getVisibleCells(): Cell<_TData>[];
  }

  export interface Header<_TData> {
    id: string;
    isPlaceholder: boolean;
    column: Column<_TData>;
    getSize(): number;
    getContext(): unknown;
  }

  export interface HeaderGroup<_TData> {
    id: string;
    headers: Header<_TData>[];
  }

  export interface Table<_TData> {
    getHeaderGroups(): HeaderGroup<_TData>[];
    getRowModel(): { rows: Row<_TData>[] };
    getIsAllPageRowsSelected(): boolean;
    getToggleAllPageRowsSelectedHandler(): (event: unknown) => void;
    getFilteredSelectedRowModel(): { rows: Row<_TData>[] };
    getFilteredRowModel(): { rows: Row<_TData>[] };
    getState(): { pagination: { pageIndex: number; pageSize: number } };
    getPageCount(): number;
    getCanPreviousPage(): boolean;
    getCanNextPage(): boolean;
    previousPage(): void;
    nextPage(): void;
  }

  export function useReactTable<_TData>(options: Record<string, unknown>): Table<_TData>;
  export function getCoreRowModel(): unknown;
  export function getSortedRowModel(): unknown;
  export function getPaginationRowModel(): unknown;
  export function flexRender(component: unknown, context: unknown): ReactNode;
}
