import { Money } from "./core";

// --- Spend Analysis ---
export interface SpendByMonth {
  month: number; // 1-12
  totalAmount: Money;
}

export interface SpendAnalysisData {
  category: string; // e.g., Cost Center name
  totalAmount: Money;
  byMonth: SpendByMonth[];
}

// --- AP Aging ---
export type AgingBucket = '0-30' | '31-60' | '61-90' | '>90';

export interface APAgingData {
  vendorName: string;
  invoiceNo: string;
  dueDate: string;
  amount: Money;
  bucket: AgingBucket;
  daysOverdue: number;
}

// --- Open PO ---
export interface OpenPOData {
  poId: string;
  poDocNo: string;
  poDate: string;
  vendorName: string;
  lineId: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  eta: string; // Estimated Time of Arrival
}

// --- Vendor Performance ---
export interface VendorPerformanceData {
  vendorId: string;
  vendorName: string;
  onTimeDeliveryRate: number; // 0-100
  qualityScore: number; // 0-100
  avgPriceCompetitiveness: number; // 0-100 (lower is better, e.g., 95 means 5% more expensive than best bid)
  totalPOs: number;
}
