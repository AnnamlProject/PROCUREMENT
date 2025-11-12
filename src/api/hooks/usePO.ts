// This is a placeholder for PO-related React Query hooks.
// Follow the pattern in usePR.ts to implement hooks for PO operations.

export const poKeys = {
  all: ['pos'] as const,
  lists: () => [...poKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...poKeys.lists(), filters] as const,
  details: () => [...poKeys.all, 'detail'] as const,
  detail: (id: string) => [...poKeys.details(), id] as const,
};
