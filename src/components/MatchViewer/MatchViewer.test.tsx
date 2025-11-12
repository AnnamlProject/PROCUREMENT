import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MatchViewer } from './MatchViewer';
import { PO, GoodsReceipt, Invoice, DocStatus } from '@/api/types/purchasing';
import { Toaster } from '../ui/toaster';
// FIX: Imported React to define the React namespace, resolving errors with types like React.ReactNode.
import React from 'react';

// Mock data
const mockPO: PO = {
    id: 'po-1', docNo: 'PO-001', status: DocStatus.RELEASED, poType: 'STANDARD',
    vendorId: 'v-1', paymentTerms: '', deliveryAddress: '', currencyId: 'c-1',
    subtotal: 2000, taxAmount: 220, grandTotal: 2220,
    createdAt: '', updatedAt: '',
    lines: [{
        id: 'pol-1', description: 'Item A', quantity: 10, price: 100, total: 1000, schedules: [],
    }, {
        id: 'pol-2', description: 'Item B', quantity: 5, price: 200, total: 1000, schedules: [],
    }]
};

const mockGRN: GoodsReceipt[] = [{
    id: 'grn-1', docNo: 'GRN-001', status: DocStatus.POSTED, poId: 'po-1', deliveryOrderNo: 'DO-001',
    createdAt: '', updatedAt: '',
    lines: [{ id: 'grnl-1', poLineId: 'pol-1', receivedQty: 9, qcResult: 'PASS' },
            { id: 'grnl-2', poLineId: 'pol-2', receivedQty: 5, qcResult: 'PASS' }]
}];

const mockInvoice: Invoice = {
    id: 'inv-1', vendorInvoiceNo: 'INV-001', status: DocStatus.SUBMITTED, poId: 'po-1', vendorId: 'v-1',
    subtotal: 1950, grandTotal: 2145, dueDate: '', paymentStatus: 'UNPAID',
    createdAt: '', updatedAt: '',
    taxes: [],
    lines: [{ id: 'invl-1', poLineId: 'pol-1', description: 'Item A', quantity: 9, price: 105, total: 945 },
            { id: 'invl-2', poLineId: 'pol-2', description: 'Item B', quantity: 5, price: 200, total: 1000 }]
};

describe('MatchViewer', () => {
    it('should highlight discrepancies in a 3-way match', () => {
        // FIX: Removed the TestWrapper component and rendered MatchViewer and Toaster directly in a fragment to resolve a TypeScript error.
        render(<>
            <MatchViewer po={mockPO} receipts={mockGRN} invoice={mockInvoice} />
            <Toaster />
        </>);
        
        // Check for the variant alert
        expect(screen.getByText('Ditemukan Varian')).toBeInTheDocument();

        // Check Item A: Qty received is 9 (vs 10 ordered). Price is 105 (vs 100 ordered)
        const itemARow = screen.getByText('Item A').closest('tr');
        expect(itemARow).toBeInTheDocument();
        const cells = itemARow?.querySelectorAll('td');

        expect(cells?.[1]).toHaveTextContent('10'); // PO Qty
        expect(cells?.[2]).toHaveTextContent('9'); // Received Qty
        expect(cells?.[2]).toHaveClass('text-red-600'); // Check qty discrepancy color (PO vs GRN)
        
        expect(cells?.[4]).toHaveTextContent('Rp 100'); // PO Price
        expect(cells?.[5]).toHaveTextContent('Rp 105'); // Invoice Price
        expect(cells?.[5]).toHaveClass('text-red-600'); // Check price discrepancy color
    });

    it('should show success for a perfect 3-way match', () => {
         const perfectGRN: GoodsReceipt[] = [{...mockGRN[0],
            lines: [{ id: 'grnl-1', poLineId: 'pol-1', receivedQty: 10, qcResult: 'PASS' },
                    { id: 'grnl-2', poLineId: 'pol-2', receivedQty: 5, qcResult: 'PASS' }]
         }];
         const perfectInvoice: Invoice = { ...mockInvoice,
            lines: [
                { id: 'invl-1', poLineId: 'pol-1', description: 'Item A', quantity: 10, price: 100, total: 1000 },
                { id: 'invl-2', poLineId: 'pol-2', description: 'Item B', quantity: 5, price: 200, total: 1000 }
            ]
        };
        // FIX: Removed the TestWrapper component and rendered MatchViewer and Toaster directly in a fragment to resolve a TypeScript error.
        render(<>
            <MatchViewer po={mockPO} receipts={perfectGRN} invoice={perfectInvoice} />
            <Toaster />
        </>);
        expect(screen.getByText('Dokumen Cocok')).toBeInTheDocument();
    });
});