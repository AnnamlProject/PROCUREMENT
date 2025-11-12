import { useQuery } from '@tanstack/react-query';
import api from '../client';
import type { Invoice } from '../types/purchasing';

// This is a placeholder for Invoice-related React Query hooks.
// Follow the pattern in usePR.ts to implement hooks for Invoice operations.

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  byPO: (poId: string) => [...invoiceKeys.all, 'byPO', poId] as const,
};

const fetchInvoicesByPO = async (poId: string): Promise<Invoice[]> => {
    const { data } = await api.get('/invoices', { params: { poId } });
    return data;
};

export const useGetInvoicesByPO = (poId: string) => {
    return useQuery({
        queryKey: invoiceKeys.byPO(poId),
        queryFn: () => fetchInvoicesByPO(poId),
        enabled: !!poId,
    });
};
