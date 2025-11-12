
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import type { PR } from '../types/purchasing';
import type { PaginatedResponse } from '../types/core';

// --- Query Keys ---
export const prKeys = {
  all: ['prs'] as const,
  lists: () => [...prKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...prKeys.lists(), filters] as const,
  details: () => [...prKeys.all, 'detail'] as const,
  detail: (id: string) => [...prKeys.details(), id] as const,
};

// --- API Functions ---

// Fetch a paginated list of PRs
const fetchPRs = async (filters: Record<string, any>): Promise<PaginatedResponse<PR>> => {
  const { data } = await api.get('/pr', { params: filters });
  return data;
};

// Fetch a single PR by ID
const fetchPRById = async (id: string): Promise<PR> => {
  const { data } = await api.get(`/pr/${id}`);
  return data;
};

// Create a new PR
const createPR = async (prData: Omit<PR, 'id' | 'createdAt' | 'updatedAt'>): Promise<PR> => {
  const { data } = await api.post('/pr', prData);
  return data;
};

// Update an existing PR
const updatePR = async (prData: PR): Promise<PR> => {
    const { data } = await api.put(`/pr/${prData.id}`, prData);
    return data;
};

// Submit a PR
const submitPR = async (id: string): Promise<PR> => {
    const { data } = await api.post(`/pr/${id}/submit`);
    return data;
}

// --- Hooks ---

export const useGetPRs = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: prKeys.list(filters),
    queryFn: () => fetchPRs(filters),
  });
};

export const useGetPR = (id: string | null) => {
    return useQuery({
        queryKey: prKeys.detail(id!),
        queryFn: () => fetchPRById(id!),
        enabled: !!id,
    });
};

export const useCreatePR = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPR,
        onSuccess: () => {
            // Invalidate and refetch the list of PRs
            queryClient.invalidateQueries({ queryKey: prKeys.lists() });
        }
    });
};

export const useUpdatePR = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePR,
        onSuccess: (data) => {
             // Invalidate and refetch the list of PRs and the specific PR detail
            queryClient.invalidateQueries({ queryKey: prKeys.lists() });
            queryClient.setQueryData(prKeys.detail(data.id), data);
        }
    });
};

export const useSubmitPR = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitPR,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: prKeys.lists() });
            queryClient.setQueryData(prKeys.detail(data.id), data);
        }
    });
}
