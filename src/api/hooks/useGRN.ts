// This is a placeholder for GRN-related React Query hooks.
// Follow the pattern in usePR.ts to implement hooks for GRN operations.

export const grnKeys = {
  all: ['grns'] as const,
  lists: () => [...grnKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...grnKeys.lists(), filters] as const,
  details: () => [...grnKeys.all, 'detail'] as const,
  detail: (id: string) => [...grnKeys.details(), id] as const,
};
