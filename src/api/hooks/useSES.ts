import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { ServiceEntry } from '../types/purchasing';
import type { PaginatedResponse } from '../types/core';

// --- Query Keys ---
export const sesKeys = {
  all: ['ses'] as const,
  lists: () => [...sesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...sesKeys.lists(), filters] as const,
  details: () => [...sesKeys.all, 'detail'] as const,
  detail: (id: string) => [...sesKeys.details(), id] as const,
};

// --- API Functions ---
const fetchSESs = async (filters: Record<string, any>): Promise<PaginatedResponse<ServiceEntry>> => {
  const { data } = await api.get('/ses', { params: filters });
  return data;
};

const acceptSES = async (sesData: Partial<ServiceEntry>): Promise<ServiceEntry> => {
  const { data } = await api.post('/ses', sesData);
  return data;
};

// --- Hooks ---
export const useGetSESs = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: sesKeys.list(filters),
    queryFn: () => fetchSESs(filters),
  });
};

export const useAcceptSES = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptSES,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sesKeys.lists() });
    },
  });
};
