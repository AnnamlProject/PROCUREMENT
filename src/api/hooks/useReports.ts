import { useQuery } from '@tanstack/react-query';
import api from '../client';
import type { SpendAnalysisData, APAgingData, OpenPOData, VendorPerformanceData } from '../types/reports';

// --- Query Keys ---
export const reportKeys = {
  all: ['reports'] as const,
  spendAnalysis: (filters: any) => [...reportKeys.all, 'spend-analysis', filters] as const,
  apAging: () => [...reportKeys.all, 'ap-aging'] as const,
  openPOs: () => [...reportKeys.all, 'open-pos'] as const,
  vendorPerformance: () => [...reportKeys.all, 'vendor-performance'] as const,
};

// --- API Functions ---
const fetchSpendAnalysis = async (filters: { year: number }): Promise<SpendAnalysisData[]> => {
  const { data } = await api.get('/reports/spend-analysis', { params: filters });
  return data;
};

const fetchAPAging = async (): Promise<APAgingData[]> => {
  const { data } = await api.get('/reports/ap-aging');
  return data;
};

const fetchOpenPOs = async (): Promise<OpenPOData[]> => {
  const { data } = await api.get('/reports/open-pos');
  return data;
};

const fetchVendorPerformance = async (): Promise<VendorPerformanceData[]> => {
    const { data } = await api.get('/reports/vendor-performance');
    return data;
};


// --- Hooks ---
export const useGetSpendAnalysis = (filters: { year: number }) => {
  return useQuery({
    queryKey: reportKeys.spendAnalysis(filters),
    queryFn: () => fetchSpendAnalysis(filters),
  });
};

export const useGetAPAging = () => {
    return useQuery({
        queryKey: reportKeys.apAging(),
        queryFn: fetchAPAging,
    });
};

export const useGetOpenPOs = () => {
    return useQuery({
        queryKey: reportKeys.openPOs(),
        queryFn: fetchOpenPOs,
    });
};

export const useGetVendorPerformance = () => {
    return useQuery({
        queryKey: reportKeys.vendorPerformance(),
        queryFn: fetchVendorPerformance,
    });
};
