import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { GoodsReceipt } from '../types/purchasing';
import type { PaginatedResponse } from '../types/core';

// --- Query Keys ---
export const grnKeys = {
  all: ['grns'] as const,
  lists: () => [...grnKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...grnKeys.lists(), filters] as const,
  details: () => [...grnKeys.all, 'detail'] as const,
  detail: (id: string) => [...grnKeys.details(), id] as const,
};

// --- API Functions ---
const fetchGRNs = async (filters: Record<string, any>): Promise<PaginatedResponse<GoodsReceipt>> => {
  const { data } = await api.get('/grn', { params: filters });
  return data;
};

const postGRN = async (grnData: Partial<GoodsReceipt>): Promise<GoodsReceipt> => {
  const { data } = await api.post('/grn', grnData);
  return data;
};

// --- Hooks ---
export const useGetGRNs = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: grnKeys.list(filters),
    queryFn: () => fetchGRNs(filters),
  });
};

export const usePostGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postGRN,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grnKeys.lists() });
    },
  });
};
