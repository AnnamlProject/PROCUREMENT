import { useQuery } from '@tanstack/react-query';
import api from '../client';
import type { Uom, Tax, CostCenter, Project, Currency, Withholding } from '../types/purchasing';

// --- Query Keys ---
export const lookupKeys = {
  all: ['lookups'] as const,
  uoms: () => [...lookupKeys.all, 'uoms'] as const,
  taxes: () => [...lookupKeys.all, 'taxes'] as const,
  costCenters: () => [...lookupKeys.all, 'costCenters'] as const,
  projects: () => [...lookupKeys.all, 'projects'] as const,
  currencies: () => [...lookupKeys.all, 'currencies'] as const,
  withholdings: () => [...lookupKeys.all, 'withholdings'] as const,
};

// --- API Functions ---
const fetchLookups = async () => {
  const { data } = await api.get<{
    uoms: Uom[];
    taxes: Tax[];
    costCenters: CostCenter[];
    projects: Project[];
    currencies: Currency[];
    withholdings: Withholding[];
  }>('/lookups');
  return data;
};

// --- Hooks ---
export const useLookups = () => {
    return useQuery({
        queryKey: lookupKeys.all,
        queryFn: fetchLookups,
    });
};
