import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileDown,
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  pageCount: number;
  total: number;
  queryState: {
    pageIndex: number;
    pageSize: number;
    sorting: SortingState;
    filters: ColumnFiltersState;
  };
  setQueryState: React.Dispatch<
    React.SetStateAction<{
      pageIndex: number;
      pageSize: number;
      sorting: SortingState;
      filters: ColumnFiltersState;
    }>
  >;
  toolbarActions?: React.ReactNode;
  filterFields?: {
    value: string;
    label: string;
    options?: { value: string; label: string }[];
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pageCount,
  total,
  queryState,
  setQueryState,
  toolbarActions,
  filterFields,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      sorting: queryState.sorting,
      pagination: {
        pageIndex: queryState.pageIndex,
        pageSize: queryState.pageSize,
      },
      columnFilters: queryState.filters,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(queryState.sorting) : updater;
      setQueryState((prev) => ({ ...prev, sorting: newSorting }));
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function'
          ? updater({
              pageIndex: queryState.pageIndex,
              pageSize: queryState.pageSize,
            })
          : updater;
      setQueryState((prev) => ({
        ...prev,
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      }));
    },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === 'function' ? updater(queryState.filters) : updater;
      setQueryState((prev) => ({ ...prev, filters: newFilters, pageIndex: 0 }));
    },
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} toolbarActions={toolbarActions} filterFields={filterFields} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: queryState.pageSize }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-row-${rowIndex}`}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} total={total} />
    </div>
  );
}


// --- Toolbar Subcomponent ---
function DataTableToolbar<TData>({
  table,
  toolbarActions,
  filterFields = [],
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  toolbarActions?: React.ReactNode;
  filterFields?: {
    value: string;
    label: string;
    options?: { value: string; label: string }[];
  }[];
}) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleExport = () => {
    const rows = table.getCoreRowModel().rows.map(row => {
      const rowData: Record<string, any> = {};
      row.getVisibleCells().forEach(cell => {
         const columnDef = cell.column.columnDef as any;
         if (columnDef.accessorKey) {
            rowData[columnDef.header] = (row.original as any)[columnDef.accessorKey];
         }
      });
      return rowData;
    });
    
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterFields.map((field) => {
          if (field.options) {
             return (
                <Select
                  key={field.value}
                  value={(table.getColumn(field.value)?.getFilterValue() as string) ?? ''}
                  onValueChange={(value) => table.getColumn(field.value)?.setFilterValue(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="">Semua {field.label}</SelectItem>
                    {field.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             )
          }
          return (
            <Input
              key={field.value}
              placeholder={`Cari ${field.label}...`}
              value={(table.getColumn(field.value)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(field.value)?.setFilterValue(event.target.value)
              }
              className="h-9 w-[150px] lg:w-[250px]"
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        {toolbarActions}
      </div>
    </div>
  );
}


// --- Pagination Subcomponent ---
function DataTablePagination<TData>({
  table,
  total
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Menampilkan {table.getRowModel().rows.length} dari {total} baris.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Baris per halaman</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Halaman {table.getState().pagination.pageIndex + 1} dari{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
