import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocStatus } from '@/api/types/core';
import { formatCurrency, formatDate } from '@/lib/format';
// FIX: Import React to use React.createElement for creating elements without JSX.
import React from 'react';

// Helper to create a basic text/number column
export const createBasicColumn = <TData>(
  accessorKey: keyof TData,
  header: string,
): ColumnDef<TData> => ({
  accessorKey: accessorKey as string,
  header,
});

// Helper to create a column for dates
export const createDateColumn = <TData>(
  accessorKey: keyof TData,
  header: string,
): ColumnDef<TData> => ({
  accessorKey: accessorKey as string,
  header,
  cell: ({ row }) => {
    const value = row.getValue(accessorKey as string) as string;
    return value ? formatDate(value) : '-';
  },
});

// Helper to create a column for currency
export const createCurrencyColumn = <TData>(
  accessorKey: keyof TData,
  header: string,
): ColumnDef<TData> => ({
  accessorKey: accessorKey as string,
  header,
  cell: ({ row }) => {
    const amount = parseFloat(row.getValue(accessorKey as string));
    // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
    return React.createElement('div', { className: "text-right font-medium" }, formatCurrency(amount));
  },
});


// Helper to create a column with a status badge
export const createStatusBadgeColumn = <TData>(
  accessorKey: keyof TData,
  header: string,
): ColumnDef<TData> => ({
  accessorKey: accessorKey as string,
  header,
  cell: ({ row }) => {
    const status = row.getValue(accessorKey as string) as DocStatus;
    const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
      status === DocStatus.APPROVED || status === DocStatus.SUBMITTED
        ? 'default'
        : status === DocStatus.DRAFT
          ? 'secondary'
          : status === DocStatus.REJECTED || status === DocStatus.CANCELED
            ? 'destructive'
            : 'outline';
    // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
    return React.createElement(Badge, { variant: variant }, status);
  },
});

// Helper to create a column with actions (e.g., View, Edit, Delete)
interface Action<TData> {
  label: string;
  onClick: (data: TData) => void;
  isHidden?: (data: TData) => boolean;
}

export const createActionsColumn = <TData>(
  actions: Action<TData>[],
): ColumnDef<TData> => ({
  id: 'actions',
  cell: ({ row }) => {
    const data = row.original;
    // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
    return React.createElement(DropdownMenu, null,
      React.createElement(DropdownMenuTrigger, { asChild: true },
        React.createElement(Button, { variant: "ghost", className: "h-8 w-8 p-0" },
          React.createElement("span", { className: "sr-only" }, "Open menu"),
          React.createElement(MoreHorizontal, { className: "h-4 w-4" })
        )
      ),
      React.createElement(DropdownMenuContent, { align: "end" },
        React.createElement(DropdownMenuLabel, null, "Aksi"),
        React.createElement(DropdownMenuSeparator, null),
        ...actions.map((action, index) => {
          if (action.isHidden && action.isHidden(data)) {
            return null;
          }
          return (
            React.createElement(DropdownMenuItem, {
              key: index,
              onClick: () => action.onClick(data)
            }, action.label)
          );
        })
      )
    );
  },
});
