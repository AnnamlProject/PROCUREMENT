import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { Invoice } from '../types/purchasing';
import { PaginatedResponse } from '../types/core';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  byPO: (poId: string) => [...invoiceKeys.all, 'byPO', poId] as const,
  duplicateCheck: (params: any) => [...invoiceKeys.all, 'duplicateCheck', params] as const,
};

// --- API Functions ---

const fetchInvoices = async (filters: Record<string, any>): Promise<PaginatedResponse<Invoice>> => {
    const { data } = await api.get('/invoices', { params: filters });
    return data;
};

const fetchInvoiceById = async (id: string): Promise<Invoice> => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
};

const fetchInvoicesByPO = async (poId: string): Promise<Invoice[]> => {
    const { data } = await api.get('/invoices', { params: { poId } });
    // In a real API, this would be paginated, returning PaginatedResponse<Invoice>
    return (data as PaginatedResponse<Invoice>).data;
};

const createInvoice = async (invoiceData: Partial<Invoice>): Promise<Invoice> => {
    const { data } = await api.post('/invoices', invoiceData);
    return data;
};

const approveInvoice = async (id: string): Promise<Invoice> => {
    const { data } = await api.post(`/invoices/${id}/approve`);
    return data;
};

const checkDuplicateInvoice = async (params: { vendorInvoiceNo: string; vendorId: string }): Promise<{ isDuplicate: boolean; existingInvoiceId?: string }> => {
    const { data } = await api.post('/invoices/check-duplicate', params);
    return data;
};


// --- Hooks ---

export const useGetInvoices = (filters: Record<string, any>) => {
    return useQuery({
        queryKey: invoiceKeys.list(filters),
        queryFn: () => fetchInvoices(filters),
        enabled: Object.values(filters).some(v => v !== undefined), // only run if filters are provided
    });
};

export const useGetInvoice = (id: string | null) => {
    return useQuery({
        queryKey: invoiceKeys.detail(id!),
        queryFn: () => fetchInvoiceById(id!),
        enabled: !!id,
    });
};

export const useGetInvoicesByPO = (poId: string) => {
    return useQuery({
        queryKey: invoiceKeys.byPO(poId),
        queryFn: () => fetchInvoicesByPO(poId),
        enabled: !!poId,
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
};

export const useApproveInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveInvoice,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
            queryClient.setQueryData(invoiceKeys.detail(data.id), data);
        },
    });
};

export const useCheckDuplicateInvoice = (params: { vendorInvoiceNo?: string; vendorId?: string }) => {
    return useQuery({
        queryKey: invoiceKeys.duplicateCheck(params),
        queryFn: () => checkDuplicateInvoice(params as { vendorInvoiceNo: string; vendorId: string }),
        enabled: false, // Only run manually
        retry: false,
    });
};
