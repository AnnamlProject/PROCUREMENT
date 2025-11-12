
import { useQuery } from '@tanstack/react-query';
import api from '../client';
import type { BudgetSummary } from '../types/purchasing';

// --- Query Keys ---
export const budgetKeys = {
  all: ['budget'] as const,
  check: (params: Record<string, any>) => [...budgetKeys.all, 'check', params] as const,
};

// --- API Functions ---
const checkBudget = async (costCenterId: string, totalAmount: number): Promise<BudgetSummary & { isSufficient: boolean }> => {
  const { data } = await api.post('/budget/check', { costCenterId, totalAmount });
  return data;
};

// --- Hooks ---
export const useBudgetCheck = (costCenterId: string | undefined, totalAmount: number | undefined) => {
    return useQuery({
        queryKey: budgetKeys.check({ costCenterId, totalAmount }),
        queryFn: () => checkBudget(costCenterId!, totalAmount!),
        enabled: false, // This query will only run when manually refetched
        retry: false,
    });
};
