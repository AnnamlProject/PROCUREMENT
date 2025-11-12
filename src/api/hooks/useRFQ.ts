
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { RFQ, RFQBid, Award } from '../types/purchasing';
import type { PaginatedResponse } from '../types/core';

// --- Query Keys ---
export const rfqKeys = {
  all: ['rfqs'] as const,
  lists: () => [...rfqKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...rfqKeys.lists(), filters] as const,
  details: () => [...rfqKeys.all, 'detail'] as const,
  detail: (id: string) => [...rfqKeys.details(), id] as const,
  detailWithBids: (id: string) => [...rfqKeys.details(), id, 'bids'] as const,
};

// --- API Functions ---

const fetchRFQs = async (filters: Record<string, any>): Promise<PaginatedResponse<RFQ>> => {
  const { data } = await api.get('/rfq', { params: filters });
  return data;
};

const fetchRFQById = async (id: string): Promise<RFQ> => {
  const { data } = await api.get(`/rfq/${id}`);
  return data;
};

const fetchRFQWithBids = async (id: string): Promise<{ rfq: RFQ; bids: RFQBid[] }> => {
    const { data } = await api.get(`/rfq/${id}/bids`);
    return data;
};

const createRFQ = async (rfqData: Partial<RFQ>): Promise<RFQ> => {
  const { data } = await api.post('/rfq', rfqData);
  return data;
};

const awardRFQ = async ({ id, awards }: { id: string, awards: Award[] }): Promise<{ message: string }> => {
    const { data } = await api.post(`/rfq/${id}/award`, { awards });
    return data;
};

// --- Hooks ---

export const useGetRFQs = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: rfqKeys.list(filters),
    queryFn: () => fetchRFQs(filters),
  });
};

export const useGetRFQ = (id: string | null) => {
    return useQuery({
        queryKey: rfqKeys.detail(id!),
        queryFn: () => fetchRFQById(id!),
        enabled: !!id,
    });
};

export const useGetRFQWithBids = (id: string | null) => {
    return useQuery({
        queryKey: rfqKeys.detailWithBids(id!),
        queryFn: () => fetchRFQWithBids(id!),
        enabled: !!id,
    });
};

export const useCreateRFQ = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRFQ,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
        }
    });
};

export const useAwardRFQ = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: awardRFQ,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: rfqKeys.list({}) });
            queryClient.invalidateQueries({ queryKey: rfqKeys.detail(variables.id) });
        }
    });
};
