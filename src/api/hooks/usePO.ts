
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { PO } from '../types/purchasing';
import type { PaginatedResponse } from '../types/core';

// --- Query Keys ---
export const poKeys = {
  all: ['pos'] as const,
  lists: () => [...poKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...poKeys.lists(), filters] as const,
  details: () => [...poKeys.all, 'detail'] as const,
  detail: (id: string) => [...poKeys.details(), id] as const,
};

// --- API Functions ---

const fetchPOs = async (filters: Record<string, any>): Promise<PaginatedResponse<PO>> => {
  const { data } = await api.get('/po', { params: filters });
  return data;
};

const fetchPOById = async (id: string): Promise<PO> => {
  const { data } = await api.get(`/po/${id}`);
  return data;
};

const createPO = async (poData: Partial<PO>): Promise<PO> => {
  const { data } = await api.post('/po', poData);
  return data;
};

const releasePO = async (id: string): Promise<PO> => {
    const { data } = await api.post(`/po/${id}/release`);
    return data;
}

// --- Hooks ---

export const useGetPOs = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: poKeys.list(filters),
    queryFn: () => fetchPOs(filters),
  });
};

export const useGetPO = (id: string | null) => {
    return useQuery({
        queryKey: poKeys.detail(id!),
        queryFn: () => fetchPOById(id!),
        enabled: !!id,
    });
};

export const useCreatePO = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPO,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: poKeys.lists() });
        }
    });
};

export const useReleasePO = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: releasePO,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: poKeys.lists() });
            queryClient.setQueryData(poKeys.detail(data.id), data);
        }
    });
}
