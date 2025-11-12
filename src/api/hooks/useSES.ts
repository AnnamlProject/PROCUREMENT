// This is a placeholder for SES-related React Query hooks.
// Follow the pattern in usePR.ts to implement hooks for SES operations.

export const sesKeys = {
  all: ['ses'] as const,
  lists: () => [...sesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...sesKeys.lists(), filters] as const,
  details: () => [...sesKeys.all, 'detail'] as const,
  detail: (id: string) => [...sesKeys.details(), id] as const,
};
