import { DocStatus } from '../types/core';
import type { CostCenter, Item, PO, PR, Project, Uom, Vendor, Tax, Currency, RFQ, RFQBid, GoodsReceipt, ServiceEntry } from '../types/purchasing';

// --- Master Data ---
export const uoms: Uom[] = [
    { id: 'uom-1', name: 'Unit', code: 'Unit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'uom-2', name: 'Box', code: 'Box', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'uom-3', name: 'Rim', code: 'Rim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const taxes: Tax[] = [
    { id: 'tax-1', name: 'PPN 11%', rate: 0.11, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tax-2', name: 'PPN 0%', rate: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const currencies: Currency[] = [
    { id: 'curr-1', name: 'Indonesian Rupiah', code: 'IDR', symbol: 'Rp', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'curr-2', name: 'US Dollar', code: 'USD', symbol: '$', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const vendors: Vendor[] = [
  { id: 'vendor-1', name: 'PT ATK Sejahtera', address: 'Jl. Sudirman No. 123', phone: '021-555-1111', email: 'sales@atksejahtera.com', qualityScore: 95, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'vendor-2', name: 'CV Komputer Cepat', address: 'Jl. Gatot Subroto No. 45', phone: '021-555-2222', email: 'info@komputercpt.com', qualityScore: 88, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'vendor-3', name: 'Sumber Makmur Kertas', address: 'Jl. Industri No. 7', phone: '021-555-3333', email: 'contact@sumbermakmur.com', qualityScore: 92, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const items: Item[] = [
  { id: 'item-1', code: 'ATK-001', name: 'Kertas HVS A4 80gr', uomId: 'uom-3', uom: uoms[2], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-2', code: 'ATK-002', name: 'Pulpen Pilot G2 Hitam', uomId: 'uom-2', uom: uoms[1], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-3', code: 'IT-001', name: 'Mouse Wireless Logitech', uomId: 'uom-1', uom: uoms[0], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const costCenters: CostCenter[] = [
    { id: 'cc-1', code: 'IT-DEPT', name: 'IT Department', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cc-2', code: 'FIN-DEPT', name: 'Finance Department', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const projects: Project[] = [
    { id: 'proj-1', code: 'PROJ-2024-UPGRADE', name: '2024 Network Upgrade', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// --- Transaction Data ---
export const prs: PR[] = [
    {
        id: 'pr-1',
        docNo: 'PR-2024-00001',
        docDate: new Date().toISOString(),
        status: DocStatus.APPROVED,
        requesterName: 'Budi Santoso',
        department: 'IT',
        costCenterId: 'cc-1',
        costCenter: costCenters[0],
        projectId: 'proj-1',
        project: projects[0],
        lines: [
            { id: 'prl-1-1', itemId: 'item-3', item: items[2], description: 'Mouse untuk tim developer', quantity: 5, uomId: 'uom-1', uom: uoms[0], estimatedPrice: 250000, total: 1250000, requiredDate: new Date().toISOString() },
            { id: 'prl-1-2', itemId: 'item-1', item: items[0], description: 'Kertas untuk printer kantor', quantity: 10, uomId: 'uom-3', uom: uoms[2], estimatedPrice: 50000, total: 500000, requiredDate: new Date().toISOString() },
        ],
        totalAmount: 1750000,
        remarks: 'Kebutuhan mendesak untuk project upgrade',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'pr-2',
        docNo: 'PR-2024-00002',
        docDate: new Date().toISOString(),
        status: DocStatus.DRAFT,
        requesterName: 'Ani Yudhoyono',
        department: 'Finance',
        costCenterId: 'cc-2',
        costCenter: costCenters[1],
        lines: [
            { id: 'prl-2-1', itemId: 'item-2', item: items[1], description: 'Stok pulpen bulanan', quantity: 2, uomId: 'uom-2', uom: uoms[1], estimatedPrice: 150000, total: 300000, requiredDate: new Date().toISOString() },
        ],
        totalAmount: 300000,
        remarks: 'Pengadaan rutin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
     {
        id: 'pr-3',
        docNo: 'PR-2024-00003',
        docDate: new Date().toISOString(),
        status: DocStatus.SUBMITTED,
        requesterName: 'Charlie',
        department: 'IT',
        costCenterId: 'cc-1',
        costCenter: costCenters[0],
        lines: [
            { id: 'prl-3-1', itemId: 'item-2', item: items[1], description: 'Pulpen tambahan', quantity: 5, uomId: 'uom-2', uom: uoms[1], estimatedPrice: 150000, total: 750000, requiredDate: new Date().toISOString() },
        ],
        totalAmount: 750000,
        remarks: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export const rfqs: RFQ[] = [
    {
        id: 'rfq-1',
        docNo: 'RFQ-2024-00001',
        docDate: new Date().toISOString(),
        status: DocStatus.CLOSED,
        prIds: ['pr-1'],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        lines: [
            { id: 'rfql-1-1', prSourceLineId: 'prl-1-1', item: items[2], description: 'Mouse untuk tim developer', quantity: 5, uom: uoms[0], targetDate: new Date().toISOString() },
            { id: 'rfql-1-2', prSourceLineId: 'prl-1-2', item: items[0], description: 'Kertas untuk printer kantor', quantity: 10, uom: uoms[2], targetDate: new Date().toISOString() },
        ],
        invitedVendorIds: ['vendor-1', 'vendor-2', 'vendor-3'],
        invitedVendors: vendors,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        awardedVendors: [
            { rfqLineId: 'rfql-1-1', vendorId: 'vendor-2', awardedQty: 5, price: 245000 },
            { rfqLineId: 'rfql-1-2', vendorId: 'vendor-3', awardedQty: 10, price: 48000 }
        ]
    }
];

export const rfqBids: RFQBid[] = [
    // Bids for RFQ-1, Line 1 (Mouse)
    { id: 'bid-1-1-1', rfqLineId: 'rfql-1-1', vendorId: 'vendor-2', vendorName: 'CV Komputer Cepat', price: 245000, leadTimeDays: 3 },
    { id: 'bid-1-1-2', rfqLineId: 'rfql-1-1', vendorId: 'vendor-1', vendorName: 'PT ATK Sejahtera', price: 255000, leadTimeDays: 5 },
    // Bids for RFQ-1, Line 2 (Kertas)
    { id: 'bid-1-2-1', rfqLineId: 'rfql-1-2', vendorId: 'vendor-3', vendorName: 'Sumber Makmur Kertas', price: 48000, leadTimeDays: 2 },
    { id: 'bid-1-2-2', rfqLineId: 'rfql-1-2', vendorId: 'vendor-1', vendorName: 'PT ATK Sejahtera', price: 49500, leadTimeDays: 4 },
    { id: 'bid-1-2-3', rfqLineId: 'rfql-1-2', vendorId: 'vendor-2', vendorName: 'CV Komputer Cepat', price: 51000, leadTimeDays: 3 },
];

export const pos: PO[] = [
    {
        id: 'po-1',
        docNo: 'PO-2024-00001',
        docDate: new Date().toISOString(),
        status: DocStatus.RELEASED,
        poType: 'STANDARD',
        rfqId: 'rfq-1',
        vendorId: 'vendor-2', // Mixed vendors from award, simplified to one for the PO header
        vendor: vendors[1],
        currencyId: 'curr-1',
        currency: currencies[0],
        paymentTerms: 'Net 30',
        deliveryAddress: 'Gudang Pusat, Jl. Raya Serpong Km 10',
        tolerance: 10, // 10% tolerance
        lines: [
            { id: 'pol-1-1', rfqLineId: 'rfql-1-1', item: items[2], description: 'Mouse untuk tim developer', quantity: 5, uom: uoms[0], price: 245000, total: 1225000, taxId: 'tax-1', schedules: [] },
            { id: 'pol-1-2', rfqLineId: 'rfql-1-2', item: items[0], description: 'Kertas untuk printer kantor', quantity: 10, uom: uoms[2], price: 48000, total: 480000, taxId: 'tax-1', schedules: [] }
        ],
        subtotal: 1705000,
        taxAmount: 187550,
        grandTotal: 1892550,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'po-2',
        docNo: 'PO-2024-00002',
        docDate: new Date().toISOString(),
        status: DocStatus.RELEASED,
        poType: 'SERVICE',
        vendorId: 'vendor-1',
        vendor: vendors[0],
        currencyId: 'curr-1',
        currency: currencies[0],
        paymentTerms: 'Net 45',
        deliveryAddress: 'Kantor Pusat, Jl. Sudirman Kav. 50',
        lines: [
            { id: 'pol-2-1', description: 'Jasa Konsultasi Implementasi Sistem', quantity: 1, price: 25000000, total: 25000000, taxId: 'tax-1', schedules: [] }
        ],
        subtotal: 25000000,
        taxAmount: 2750000,
        grandTotal: 27750000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const grns: GoodsReceipt[] = [];
export const ses: ServiceEntry[] = [];
