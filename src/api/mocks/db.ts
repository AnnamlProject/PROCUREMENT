import { DocStatus } from '../types/core';
import type { CostCenter, Item, PO, PR, Project, Uom, Vendor, Tax, Currency, RFQ, RFQBid, GoodsReceipt, ServiceEntry, Invoice, Withholding, Payment, POSchedule, SELine } from '../types/purchasing';

// --- Master Data ---
export const uoms: Uom[] = [
    { id: 'uom-1', name: 'Unit', code: 'Unit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'uom-2', name: 'Box', code: 'Box', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'uom-3', name: 'Rim', code: 'Rim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'uom-4', name: 'Layanan', code: 'Layanan', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const taxes: Tax[] = [
    { id: 'tax-1', name: 'PPN 11%', rate: 0.11, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tax-2', name: 'PPN 0%', rate: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const withholdings: Withholding[] = [
    { id: 'wh-1', name: 'PPh 23 - 2%', rate: 0.02, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'wh-2', name: 'PPh 21 - 5%', rate: 0.05, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const currencies: Currency[] = [
    { id: 'curr-1', name: 'Indonesian Rupiah', code: 'IDR', symbol: 'Rp', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'curr-2', name: 'US Dollar', code: 'USD', symbol: '$', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const vendors: Vendor[] = [
  { id: 'vendor-1', name: 'PT ATK Sejahtera', address: 'Jl. Sudirman No. 123', phone: '021-555-1111', email: 'sales@atksejahtera.com', qualityScore: 95, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'vendor-2', name: 'CV Komputer Cepat', address: 'Jl. Gatot Subroto No. 45', phone: '021-555-2222', email: 'info@komputercpt.com', qualityScore: 88, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'vendor-3', name: 'Sumber Makmur Kertas', address: 'Jl. Industri No. 7', phone: '021-555-3333', email: 'contact@sumbermakmur.com', qualityScore: 92, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'vendor-4', name: 'PT Bersih Selalu', address: 'Jl. Kebersihan No. 1', phone: '021-555-4444', email: 'sales@bersihselalu.com', qualityScore: 98, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const items: Item[] = [
  { id: 'item-1', code: 'ATK-001', name: 'Kertas HVS A4 80gr', uomId: 'uom-3', uom: uoms[2], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-2', code: 'ATK-002', name: 'Pulpen Pilot G2 Hitam', uomId: 'uom-2', uom: uoms[1], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-3', code: 'IT-001', name: 'Mouse Wireless Logitech', uomId: 'uom-1', uom: uoms[0], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-4', code: 'SVC-001', name: 'Jasa Kebersihan Bulanan', uomId: 'uom-4', uom: uoms[3], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const costCenters: CostCenter[] = [
    { id: 'cc-1', code: 'IT-DEPT', name: 'IT Department', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cc-2', code: 'FIN-DEPT', name: 'Finance Department', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cc-3', code: 'GA-DEPT', name: 'General Affairs', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const projects: Project[] = [
    { id: 'proj-1', code: 'PROJ-2024-UPGRADE', name: '2024 Network Upgrade', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// --- Transaction Data ---
// Base Data for other modules
const basePrs: PR[] = [
    {
        id: 'pr-1', docNo: 'PR-2024-00001', docDate: new Date().toISOString(), status: DocStatus.APPROVED, requesterName: 'Budi Santoso', department: 'IT', costCenterId: 'cc-1', costCenter: costCenters[0], projectId: 'proj-1', project: projects[0],
        lines: [
            { id: 'prl-1-1', itemId: 'item-3', item: items[2], description: 'Mouse untuk tim developer', quantity: 5, uomId: 'uom-1', uom: uoms[0], estimatedPrice: 250000, total: 1250000, requiredDate: new Date().toISOString() },
            { id: 'prl-1-2', itemId: 'item-1', item: items[0], description: 'Kertas untuk printer kantor', quantity: 10, uomId: 'uom-3', uom: uoms[2], estimatedPrice: 50000, total: 500000, requiredDate: new Date().toISOString() },
        ],
        totalAmount: 1750000, remarks: 'Kebutuhan mendesak untuk project upgrade', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'pr-2', docNo: 'PR-2024-00002', docDate: new Date().toISOString(), status: DocStatus.DRAFT, requesterName: 'Ani Yudhoyono', department: 'Finance', costCenterId: 'cc-2', costCenter: costCenters[1],
        lines: [{ id: 'prl-2-1', itemId: 'item-2', item: items[1], description: 'Stok pulpen bulanan', quantity: 2, uomId: 'uom-2', uom: uoms[1], estimatedPrice: 150000, total: 300000, requiredDate: new Date().toISOString() }],
        totalAmount: 300000, remarks: 'Pengadaan rutin', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
     {
        id: 'pr-3', docNo: 'PR-2024-00003', docDate: new Date().toISOString(), status: DocStatus.SUBMITTED, requesterName: 'Charlie', department: 'IT', costCenterId: 'cc-1', costCenter: costCenters[0],
        lines: [{ id: 'prl-3-1', itemId: 'item-2', item: items[1], description: 'Pulpen tambahan', quantity: 5, uomId: 'uom-2', uom: uoms[1], estimatedPrice: 150000, total: 750000, requiredDate: new Date().toISOString() }],
        totalAmount: 750000, remarks: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
];

// --- Scenario A: Goods Procurement ---
const scenarioA_PR: PR = {
    id: 'pr-scn-a', docNo: 'PR-2024-SCN-A1', docDate: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString(), status: DocStatus.APPROVED, requesterName: 'Scenario User A', department: 'Finance', costCenterId: 'cc-2', costCenter: costCenters[1],
    lines: [{ id: 'prl-scn-a-1', itemId: 'item-2', item: items[1], description: 'Pulpen Pilot G2 Hitam Scenario', quantity: 10, uomId: 'uom-2', uom: uoms[1], estimatedPrice: 150000, total: 1500000, requiredDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString() }],
    totalAmount: 1500000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const scenarioA_RFQ: RFQ = {
    id: 'rfq-scn-a', docNo: 'RFQ-2024-SCN-A1', docDate: new Date(new Date().setDate(new Date().getDate() - 24)).toISOString(), status: DocStatus.CLOSED, prIds: ['pr-scn-a'],
    deadline: new Date(new Date().setDate(new Date().getDate() - 17)).toISOString(),
    lines: [{ id: 'rfql-scn-a-1', prSourceLineId: 'prl-scn-a-1', item: items[1], description: 'Pulpen Pilot G2 Hitam Scenario', quantity: 10, uom: uoms[1], targetDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString() }],
    invitedVendorIds: ['vendor-1', 'vendor-2', 'vendor-3'], invitedVendors: vendors.slice(0, 3),
    awardedVendors: [{ rfqLineId: 'rfql-scn-a-1', vendorId: 'vendor-1', awardedQty: 10, price: 145000 }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const scenarioA_Bids: RFQBid[] = [
    { id: 'bid-scn-a-1', rfqLineId: 'rfql-scn-a-1', vendorId: 'vendor-1', vendorName: 'PT ATK Sejahtera', price: 145000, leadTimeDays: 3 },
    { id: 'bid-scn-a-2', rfqLineId: 'rfql-scn-a-1', vendorId: 'vendor-2', vendorName: 'CV Komputer Cepat', price: 148000, leadTimeDays: 2 },
    { id: 'bid-scn-a-3', rfqLineId: 'rfql-scn-a-1', vendorId: 'vendor-3', vendorName: 'Sumber Makmur Kertas', price: 152000, leadTimeDays: 5 },
];
const scenarioA_PO: PO = {
    id: 'po-scn-a', docNo: 'PO-2024-SCN-A1', docDate: new Date(new Date().setDate(new Date().getDate() - 16)).toISOString(), status: DocStatus.RELEASED, poType: 'STANDARD', rfqId: 'rfq-scn-a',
    vendorId: 'vendor-1', vendor: vendors[0], currencyId: 'curr-1', currency: currencies[0], paymentTerms: 'Net 30', deliveryAddress: 'Kantor Pusat', tolerance: 5,
    lines: [{ id: 'pol-scn-a-1', rfqLineId: 'rfql-scn-a-1', item: items[1], description: 'Pulpen Pilot G2 Hitam Scenario', quantity: 10, uom: uoms[1], price: 145000, total: 1450000, taxId: 'tax-1', schedules: [{ id: 'sch-scn-a', deliveryDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), quantity: 10 }] }],
    subtotal: 1450000, taxAmount: 159500, grandTotal: 1609500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const scenarioA_GRN_Partial: GoodsReceipt = {
    id: 'grn-scn-a', docNo: 'GRN-2024-SCN-A1', docDate: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(), status: DocStatus.POSTED, poId: 'po-scn-a', po: scenarioA_PO,
    deliveryOrderNo: 'DO-SCN-A-123',
    lines: [{ id: 'grnl-scn-a-1', poLineId: 'pol-scn-a-1', receivedQty: 7, qcResult: 'PASS' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const scenarioA_Invoice: Invoice = {
    id: 'inv-scn-a', docNo: 'INV-2024-SCN-A1', vendorId: 'vendor-1', vendor: vendors[0], poId: 'po-scn-a', po: scenarioA_PO, vendorInvoiceNo: 'INV-ATK-SCN-A1',
    docDate: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), status: DocStatus.APPROVED,
    lines: [{ id: 'invl-scn-a-1', poLineId: 'pol-scn-a-1', grnLineId: 'grnl-scn-a-1', description: 'Pulpen Pilot G2 Hitam Scenario', quantity: 7, price: 145000, total: 1015000 }],
    subtotal: 1015000, taxes: [{ taxId: 'tax-1', tax: taxes[0], baseAmount: 1015000, taxAmount: 111650 }],
    grandTotal: 1126650, dueDate: new Date(new Date().setDate(new Date().getDate() + 22)).toISOString(), paymentStatus: 'UNPAID',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

// --- Scenario B: Service Procurement ---
const scenarioB_PO: PO = {
    id: 'po-scn-b', docNo: 'PO-2024-SCN-B1', docDate: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString(), status: DocStatus.RELEASED, poType: 'SERVICE',
    vendorId: 'vendor-4', vendor: vendors[3], currencyId: 'curr-1', currency: currencies[0], paymentTerms: 'Net 30', deliveryAddress: 'Gedung Sekolah A',
    lines: [{ id: 'pol-scn-b-1', itemId: 'item-4', item: items[3], description: 'Jasa Kebersihan Bulanan - Kontrak 1 Tahun', quantity: 1, uom: uoms[3], price: 60000000, total: 60000000, taxId: 'tax-1', schedules: [] }],
    subtotal: 60000000, taxAmount: 6600000, grandTotal: 66600000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const scenarioB_SES: ServiceEntry = {
    id: 'ses-scn-b', docNo: 'SES-2024-SCN-B1', docDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), status: DocStatus.ACCEPTED, poId: 'po-scn-b', po: scenarioB_PO,
    lines: [{ id: 'sel-scn-b-1', poLineId: 'pol-scn-b-1', poLine: scenarioB_PO.lines[0], description: 'Progres Jasa Kebersihan Bulan Mei', progressPercentage: 100, claimedAmount: 5000000 }],
    totalAmount: 5000000, retentionPercentage: 5, retentionAmount: 250000,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const scenarioB_Invoice: Invoice = {
    id: 'inv-scn-b', docNo: 'INV-2024-SCN-B1', vendorId: 'vendor-4', vendor: vendors[3], poId: 'po-scn-b', po: scenarioB_PO, vendorInvoiceNo: 'INV-SVC-SCN-B1',
    docDate: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(), status: DocStatus.APPROVED,
    lines: [{ id: 'invl-scn-b-1', seLineId: 'sel-scn-b-1', description: 'Tagihan Jasa Kebersihan Bulan Mei', quantity: 1, price: 5000000, total: 5000000 }],
    subtotal: 5000000, taxes: [{ taxId: 'tax-1', tax: taxes[0], baseAmount: 5000000, taxAmount: 550000 }],
    withholding: withholdings[0], withholdingAmount: 100000,
    retention: { percentage: 5, amount: 250000, releaseDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() },
    grandTotal: 5200000, // 5M + 550k PPN - 100k PPh - 250k Retensi
    dueDate: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(), paymentStatus: 'UNPAID',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

// Combine all data
export let prs: PR[] = [...basePrs, scenarioA_PR];
export let rfqs: RFQ[] = [
    {
        id: 'rfq-1', docNo: 'RFQ-2024-00001', docDate: new Date().toISOString(), status: DocStatus.CLOSED, prIds: ['pr-1'], deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lines: [
            { id: 'rfql-1-1', prSourceLineId: 'prl-1-1', item: items[2], description: 'Mouse untuk tim developer', quantity: 5, uom: uoms[0], targetDate: new Date().toISOString() },
            { id: 'rfql-1-2', prSourceLineId: 'prl-1-2', item: items[0], description: 'Kertas untuk printer kantor', quantity: 10, uom: uoms[2], targetDate: new Date().toISOString() },
        ],
        invitedVendorIds: ['vendor-1', 'vendor-2', 'vendor-3'], invitedVendors: vendors, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        awardedVendors: [ { rfqLineId: 'rfql-1-1', vendorId: 'vendor-2', awardedQty: 5, price: 245000 }, { rfqLineId: 'rfql-1-2', vendorId: 'vendor-3', awardedQty: 10, price: 48000 } ]
    },
    scenarioA_RFQ
];
export let rfqBids: RFQBid[] = [
    { id: 'bid-1-1-1', rfqLineId: 'rfql-1-1', vendorId: 'vendor-2', vendorName: 'CV Komputer Cepat', price: 245000, leadTimeDays: 3 },
    { id: 'bid-1-1-2', rfqLineId: 'rfql-1-1', vendorId: 'vendor-1', vendorName: 'PT ATK Sejahtera', price: 255000, leadTimeDays: 5 },
    { id: 'bid-1-2-1', rfqLineId: 'rfql-1-2', vendorId: 'vendor-3', vendorName: 'Sumber Makmur Kertas', price: 48000, leadTimeDays: 2 },
    { id: 'bid-1-2-2', rfqLineId: 'rfql-1-2', vendorId: 'vendor-1', vendorName: 'PT ATK Sejahtera', price: 49500, leadTimeDays: 4 },
    { id: 'bid-1-2-3', rfqLineId: 'rfql-1-2', vendorId: 'vendor-2', vendorName: 'CV Komputer Cepat', price: 51000, leadTimeDays: 3 },
    ...scenarioA_Bids
];
const createSchedules = (date: Date, qty: number): POSchedule[] => [{ id: `sch-${Math.random()}`, deliveryDate: date.toISOString(), quantity: qty }];
export let pos: PO[] = [
    {
        id: 'po-1', docNo: 'PO-2024-00001', docDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(), status: DocStatus.CLOSED, poType: 'STANDARD', rfqId: 'rfq-1', vendorId: 'vendor-2', vendor: vendors[1], currencyId: 'curr-1', currency: currencies[0], paymentTerms: 'Net 30', deliveryAddress: 'Gudang Pusat, Jl. Raya Serpong Km 10', tolerance: 10,
        lines: [
            { id: 'pol-1-1', rfqLineId: 'rfql-1-1', item: items[2], description: 'Mouse untuk tim developer', quantity: 5, uom: uoms[0], price: 245000, total: 1225000, taxId: 'tax-1', schedules: createSchedules(new Date(new Date().setDate(new Date().getDate() - 10)), 5) },
            { id: 'pol-1-2', rfqLineId: 'rfql-1-2', item: items[0], description: 'Kertas untuk printer kantor', quantity: 10, uom: uoms[2], price: 48000, total: 480000, taxId: 'tax-1', schedules: createSchedules(new Date(new Date().setDate(new Date().getDate() - 5)), 10) }
        ],
        subtotal: 1705000, taxAmount: 187550, grandTotal: 1892550, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
        id: 'po-3', docNo: 'PO-2024-00003', docDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), status: DocStatus.RELEASED, poType: 'STANDARD', vendorId: 'vendor-3', vendor: vendors[2], currencyId: 'curr-1', currency: currencies[0], paymentTerms: 'Net 30', deliveryAddress: 'Gudang Pusat, Jl. Raya Serpong Km 10', tolerance: 5,
        lines: [{ id: 'pol-3-1', item: items[0], description: 'Kertas HVS A4 80gr Tambahan', quantity: 50, uom: uoms[2], price: 47500, total: 2375000, taxId: 'tax-1', schedules: createSchedules(new Date(new Date().setDate(new Date().getDate() + 15)), 50) }],
        subtotal: 2375000, taxAmount: 261250, grandTotal: 2636250, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    scenarioA_PO, scenarioB_PO,
];
export let grns: GoodsReceipt[] = [
    {
        id: 'grn-1', docNo: 'GRN-2024-00001', docDate: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(), status: DocStatus.POSTED, poId: 'po-1', po: pos[0], deliveryOrderNo: 'DO-VENDOR-123',
        lines: [
            { id: 'grnl-1-1', poLineId: 'pol-1-1', receivedQty: 5, qcResult: 'PASS' },
            { id: 'grnl-1-2', poLineId: 'pol-1-2', receivedQty: 10, qcResult: 'PASS' } // Fully received now
        ], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'grn-2', docNo: 'GRN-2024-00002', docDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), status: DocStatus.POSTED, poId: 'po-3', po: pos[1], deliveryOrderNo: 'DO-VENDOR-456',
        lines: [{ id: 'grnl-2-1', poLineId: 'pol-3-1', receivedQty: 20, qcResult: 'PASS' }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    scenarioA_GRN_Partial,
];
export let ses: ServiceEntry[] = [scenarioB_SES];
export let invoices: Invoice[] = [
    {
        id: 'inv-1', docNo: 'INV/2024/ATK/001', vendorId: 'vendor-2', vendor: vendors[1], poId: 'po-1', po: pos[0], vendorInvoiceNo: 'ATK-S/24/05/103', docDate: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), status: DocStatus.APPROVED,
        lines: [
            { id: 'invl-1-1', poLineId: 'pol-1-1', grnLineId: 'grnl-1-1', description: 'Mouse untuk tim developer', quantity: 5, price: 245000, total: 1225000 },
            { id: 'invl-1-2', poLineId: 'pol-1-2', grnLineId: 'grnl-1-2', description: 'Kertas untuk printer kantor', quantity: 10, price: 48000, total: 480000 },
        ],
        subtotal: 1705000, taxes: [{ taxId: 'tax-1', tax: taxes[0], baseAmount: 1705000, taxAmount: 187550 }],
        grandTotal: 1892550, dueDate: new Date(new Date().setDate(new Date().getDate() + 22)).toISOString(), paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'inv-2', docNo: 'INV/2024/FIN/002', vendorId: 'vendor-1', vendor: vendors[0], poId: 'po-1', po: pos[0], vendorInvoiceNo: 'INV-CONS-001', docDate: new Date(new Date().setDate(new Date().getDate() - 50)).toISOString(), status: DocStatus.APPROVED,
        lines: [ { id: 'invl-2-1', description: 'Jasa Konsultasi Implementasi Sistem - Termin 1', quantity: 1, price: 12500000, total: 12500000 } ],
        subtotal: 12500000, taxes: [{ taxId: 'tax-1', tax: taxes[0], baseAmount: 12500000, taxAmount: 1375000 }], withholding: withholdings[0], withholdingAmount: 250000,
        grandTotal: 13625000, dueDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
     {
        id: 'inv-3', docNo: 'INV/2024/ATK/003', vendorId: 'vendor-3', vendor: vendors[2], poId: 'po-1', po: pos[0], vendorInvoiceNo: 'SMK/24/04/088', docDate: new Date(new Date().setDate(new Date().getDate() - 80)).toISOString(), status: DocStatus.APPROVED,
        lines: [ { id: 'invl-3-1', description: 'Kertas HVS A4', quantity: 2, price: 48000, total: 96000 } ],
        subtotal: 96000, taxes: [{ taxId: 'tax-1', tax: taxes[0], baseAmount: 96000, taxAmount: 10560 }],
        grandTotal: 106560, dueDate: new Date(new Date().setDate(new Date().getDate() - 50)).toISOString(), paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'inv-4', docNo: 'INV/2024/ATK/004', vendorId: 'vendor-1', vendor: vendors[0], poId: 'po-1', po: pos[0], vendorInvoiceNo: 'ATK/24/01/001', docDate: new Date(new Date().setDate(new Date().getDate() - 120)).toISOString(), status: DocStatus.APPROVED,
        lines: [ { id: 'invl-4-1', description: 'Jasa Maintenance', quantity: 1, price: 5000000, total: 5000000 } ],
        subtotal: 5000000, taxes: [{ taxId: 'tax-1', tax: taxes[0], baseAmount: 5000000, taxAmount: 550000 }],
        grandTotal: 5550000, dueDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString(), paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    scenarioA_Invoice, scenarioB_Invoice
];

export let payments: Payment[] = [];
