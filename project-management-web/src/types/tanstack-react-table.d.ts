/**
 * Type declaration for @tanstack/react-table
 * This declaration file provides type safety until the package is installed.
 * Run `npm install` to resolve the actual module.
 */
declare module '@tanstack/react-table' {
  export type ColumnDef<TData, TValue = unknown> = {
    id?: string;
    accessorKey?: string;
    header?: any;
    cell?: any;
    size?: number;
    enableSorting?: boolean;
  };

  export type SortingState = Array<{ id: string; desc: boolean }>;
  export type RowSelectionState = Record<string, boolean>;

  export interface Table<TData> {
    getHeaderGroups(): any[];
    getRowModel(): { rows: any[] };
    getIsAllPageRowsSelected(): boolean;
    getToggleAllPageRowsSelectedHandler(): any;
    getFilteredSelectedRowModel(): { rows: any[] };
    getFilteredRowModel(): { rows: any[] };
    getState(): { pagination: { pageIndex: number; pageSize: number } };
    getPageCount(): number;
    getCanPreviousPage(): boolean;
    getCanNextPage(): boolean;
    previousPage(): void;
    nextPage(): void;
  }

  export function useReactTable<TData>(options: any): Table<TData>;
  export function getCoreRowModel(): any;
  export function getSortedRowModel(): any;
  export function getPaginationRowModel(): any;
  export function flexRender(component: any, context: any): any;
}
