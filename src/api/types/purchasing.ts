
import type { BaseEntity, Money, DocStatus } from './core';

// --- Master Data ---
export interface Vendor extends BaseEntity {
  name: string;
  address: string;
  phone: string;
  email: string;
  qualityScore?: number; // 0-100
}

export interface Item extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  uomId: string;
  uom?: Uom;
}

export interface Uom extends BaseEntity {
  name: string;
  code: string;
}

export interface Tax extends BaseEntity {
  name: string;
  rate: number; // e.g., 0.11 for 11%
}

export interface Withholding extends BaseEntity {
    name: string;
    rate: number;
}

export interface Currency extends BaseEntity {
  code: string; // e.g., IDR, USD
  name: string;
  symbol: string;
}

export interface CostCenter extends BaseEntity {
  code: string;
  name: string;
}

export interface Project extends BaseEntity {
  code: string;
  name: string;
}

export interface BudgetSummary {
  costCenterId: string;
  projectId?: string;
  totalBudget: Money;
  totalCommitted: Money;
  totalActual: Money;
  remainingBudget: Money;
}

// --- Procurement Documents ---

// Purchase Requisition
export interface PRLine {
  id: string;
  itemId: string;
  item?: Item;
  description: string;
  quantity: number;
  uomId: string;
  uom?: Uom;
  estimatedPrice: Money;
  total: Money;
  requiredDate: string;
}

export interface PR extends BaseEntity {
  requesterName: string;
  department: string;
  costCenterId: string;
  costCenter?: CostCenter;
  projectId?: string;
  project?: Project;
  lines: PRLine[];
  totalAmount: Money;
}

// Request for Quotation
export interface RFQLine {
  id: string;
  prSourceLineId: string; // Link back to the original PR Line
  item: Item;
  description: string;
  quantity: number;
  uom: Uom;
  targetDate: string;
}
export interface RFQ extends BaseEntity {
  prIds: string[];
  deadline: string;
  lines: RFQLine[];
  invitedVendorIds: string[];
  invitedVendors?: Vendor[];
}

export interface RFQBid {
  id: string;
  rfqLineId: string;
  vendorId: string;
  vendorName?: string;
  price: Money;
  leadTimeDays: number;
  remarks?: string;
}

export interface BidScore {
    vendorId: string;
    priceScore: number;
    leadTimeScore: number;
    qualityScore: number;
    totalScore: number;
}

export interface Award {
    rfqLineId: string;
    vendorId: string;
    awardedQty: number;
}


// Purchase Order
export interface POSchedule {
  id: string;
  deliveryDate: string;
  quantity: number;
}

export interface POLine {
  id: string;
  prLineId?: string;
  item?: Item;
  description: string;
  quantity: number;
  uom?: Uom;
  price: Money;
  total: Money;
  taxId?: string;
  tax?: Tax;
  schedules: POSchedule[];
}

export interface PO extends BaseEntity {
  vendorId: string;
  vendor?: Vendor;
  currencyId: string;
  currency?: Currency;
  lines: POLine[];
  subtotal: Money;
  taxAmount: Money;
  grandTotal: Money;
}

// Goods Receipt
export interface QCResult {
  id: string;
  parameter: string;
  result: 'PASS' | 'FAIL';
  notes?: string;
}
export interface GRLine {
  id: string;
  poLineId: string;
  poLine?: POLine;
  receivedQty: number;
  batchNo?: string;
  serialNo?: string;
  qcResults?: QCResult[];
}
export interface GoodsReceipt extends BaseEntity {
  poId: string;
  po?: PO;
  deliveryOrderNo: string;
  lines: GRLine[];
}


// Service Entry
export interface Milestone {
    id: string;
    description: string;
    percentage: number; // 0-100
    dueDate: string;
    status: 'PENDING' | 'COMPLETED' | 'VERIFIED';
}
export interface Timesheet {
    id: string;
    consultantName: string;
    startDate: string;
    endDate: string;
    hoursWorked: number;
}
export interface SELine {
  id: string;
  poLineId: string;
  poLine?: POLine;
  description: string;
  amount?: Money;
  percentage?: number;
  milestone?: Milestone;
  timesheet?: Timesheet;
}

export interface ServiceEntry extends BaseEntity {
  poId: string;
  po?: PO;
  lines: SELine[];
  totalAmount: Money;
}

// Invoice
export interface Retention {
    percentage: number;
    amount: Money;
    releaseDate: string;
}

export interface Prepayment {
    id: string;
    amount: Money;
    appliedAmount: Money;
}

export interface InvoiceTax {
    taxId: string;
    tax?: Tax;
    baseAmount: Money;
    taxAmount: Money;
}
export interface InvoiceLine {
  id: string;
  poLineId?: string;
  grnLineId?: string;
  seLineId?: string;
  description: string;
  quantity: number;
  price: Money;
  total: Money;
}
export interface Invoice extends BaseEntity {
  vendorId: string;
  vendor?: Vendor;
  poId: string;
  po?: PO;
  vendorInvoiceNo: string;
  lines: InvoiceLine[];
  subtotal: Money;
  taxes: InvoiceTax[];
  withholding?: Withholding;
  withholdingAmount?: Money;
  retention?: Retention;
  prepayment?: Prepayment;
  grandTotal: Money;
  dueDate: string;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
}

// Payment
export interface PaymentLine {
    id: string;
    invoiceId: string;
    invoice?: Invoice;
    amountPaid: Money;
}
export interface Payment extends BaseEntity {
    paymentMethod: 'TRANSFER' | 'CASH' | 'CHEQUE';
    bankAccount: string;
    lines: PaymentLine[];
    totalPaid: Money;
}
