import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { Payment } from '../types/purchasing';
import type { PaginatedResponse } from '../types/core';
import { invoiceKeys } from './useInvoice';

// --- Query Keys ---
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

// --- API Functions ---
const fetchPayments = async (filters: Record<string, any>): Promise<PaginatedResponse<Payment>> => {
    const { data } = await api.get('/payments', { params: filters });
    return data;
};

const executePaymentRun = async (payload: { invoiceIds: string[], bankFee: number }): Promise<Payment> => {
    const { data } = await api.post('/payments/execute', payload);
    return data;
}

// --- Hooks ---
export const useGetPayments = (filters: Record<string, any>) => {
    return useQuery({
        queryKey: paymentKeys.list(filters),
        queryFn: () => fetchPayments(filters),
    });
};

export const useExecutePaymentRun = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: executePaymentRun,
        onSuccess: () => {
            // Refetch payments list
            queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
            // Refetch invoices list as their status has changed
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
};
