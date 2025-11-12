// FIX: Imported `within` utility to scope queries to a specific element.
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/api/mocks/server';
import BidTabulationPage from './BidTabulationPage';
import { Toaster } from '@/components/ui/toaster';
import { RFQ, RFQBid, DocStatus } from '@/api/types/purchasing';

const testRfqId = 'test-rfq-1';
const mockRfq: RFQ = {
    id: testRfqId, docNo: 'RFQ-TEST-001', status: DocStatus.SUBMITTED,
    lines: [{ id: 'rfqline-1', prSourceLineId: '', item: { id: 'item-1', name: 'Test Item', code: 'TI', uomId: 'uom-1' }, description: '', quantity: 10, uom: { id: 'uom-1', name: 'Unit', code: 'U' }, targetDate: '' }],
    invitedVendorIds: ['vendor-1', 'vendor-2'],
    invitedVendors: [
        { id: 'vendor-1', name: 'Vendor A', qualityScore: 90, address: '', phone: '', email: '', createdAt: '', updatedAt: '' },
        { id: 'vendor-2', name: 'Vendor B', qualityScore: 80, address: '', phone: '', email: '', createdAt: '', updatedAt: '' },
    ],
    prIds: [],
    deadline: '',
    createdAt: '',
    updatedAt: ''
};

const mockBids: RFQBid[] = [
    { id: 'bid-1', rfqLineId: 'rfqline-1', vendorId: 'vendor-1', price: 100, leadTimeDays: 5 },
    { id: 'bid-2', rfqLineId: 'rfqline-1', vendorId: 'vendor-2', price: 120, leadTimeDays: 3 },
];

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderComponent = () => {
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[`/purchasing/rfq/${testRfqId}/bid-tabulation`]}>
                <Routes>
                    <Route path="/purchasing/rfq/:id/bid-tabulation" element={<BidTabulationPage />} />
                </Routes>
                <Toaster />
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('BidTabulationPage', () => {
    it('calculates scores correctly and recommends the best vendor', async () => {
        server.use(
            http.get(`/api/rfq/${testRfqId}/bids`, () => {
                return HttpResponse.json({ rfq: mockRfq, bids: mockBids });
            })
        );
        
        renderComponent();
        
        await waitFor(() => expect(screen.getByText('Tabulasi Penawaran: RFQ-TEST-001')).toBeInTheDocument());

        // Default weights: price 60, leadTime 20, quality 20
        // Vendor A: Price=100 (best), LT=5, Q=90
        //   PriceScore = (100/100)*60 = 60
        //   LTScore = (3/5)*20 = 12
        //   QScore = (90/100)*20 = 18
        //   Total = 60 + 12 + 18 = 90
        // Vendor B: Price=120, LT=3 (best), Q=80
        //   PriceScore = (100/120)*60 = 50
        //   LTScore = (3/3)*20 = 20
        //   QScore = (80/100)*20 = 16
        //   Total = 50 + 20 + 16 = 86
        // Vendor A should be recommended.

        const vendorARow = screen.getByText('Vendor A').closest('tr');
        expect(vendorARow).toHaveTextContent('90.00'); // Check total score
        expect(within(vendorARow!).getByText('Rekomendasi')).toBeInTheDocument();

        const vendorBRow = screen.getByText('Vendor B').closest('tr');
        expect(vendorBRow).toHaveTextContent('86.00');
    });

    it('allows selecting a winner and enables save button', async () => {
        server.use(
            http.get(`/api/rfq/${testRfqId}/bids`, () => {
                return HttpResponse.json({ rfq: mockRfq, bids: mockBids });
            })
        );

        renderComponent();
        await waitFor(() => expect(screen.getByText('Vendor A')).toBeInTheDocument());
        
        const selectWinnerButtons = screen.getAllByRole('button', { name: /Pilih Pemenang/i });
        fireEvent.click(selectWinnerButtons[1]); // Select Vendor B

        await waitFor(() => {
            expect(screen.getByText('Pemenang')).toBeInTheDocument();
        });

        // "Simpan Award" button should now be enabled
        expect(screen.getByRole('button', { name: /Simpan Award/i })).toBeEnabled();
    });
});