import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';

import { server } from '@/api/mocks/server';
import PREditPage from './PREditPage';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/app/providers/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const renderComponent = (id?: string) => {
    const route = id ? `/purchasing/pr/edit/${id}` : '/purchasing/pr/new';
    render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        <Route path="/purchasing/pr/new" element={<PREditPage />} />
                        <Route path="/purchasing/pr/edit/:id" element={<PREditPage />} />
                    </Routes>
                    <Toaster />
                </MemoryRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
};

describe('PREditPage', () => {
    // MSW handler for lookups, consistent across tests
    beforeAll(() => {
        server.use(
            http.get('/api/lookups', () => {
                return HttpResponse.json({
                    costCenters: [{ id: 'cc-1', code: 'IT', name: 'IT Department' }],
                    currencies: [{ id: 'curr-1', code: 'IDR', name: 'Rupiah' }],
                    items: [{ id: 'item-1', name: 'Test Item', uomId: 'uom-1' }],
                    uoms: [{id: 'uom-1', name: 'Unit', code: 'Unit'}],
                    taxes: [{ id: 'tax-1', name: 'PPN 11%', rate: 0.11 }],
                    projects: [],
                });
            }),
            http.post('/api/budget/check', () => {
                return HttpResponse.json({ isSufficient: true, remainingBudget: 5000000 });
            })
        );
    });

    it('shows validation errors when creating a new PR with empty fields', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Buat Purchase Requisition Baru')).toBeInTheDocument());

        // Attempt to go to the next step to trigger validation
        fireEvent.click(screen.getByRole('button', { name: /Selanjutnya/i }));
        
        await waitFor(() => {
            expect(screen.getByText('Nama pemohon harus diisi.')).toBeInTheDocument();
            expect(screen.getByText('Cost center harus dipilih.')).toBeInTheDocument();
        });
    });

    it('allows saving a draft after filling required fields', async () => {
        const user = userEvent.setup();
        server.use(
            http.post('/api/pr', async ({ request }) => {
                const body = await request.json();
                return HttpResponse.json({ ...(body as any), id: 'new-pr-123', docNo: 'PR-TEST-NEW' }, { status: 201 });
            })
        );

        renderComponent();
        await waitFor(() => expect(screen.getByLabelText(/Nama Pemohon/i)).toBeInTheDocument());

        // Fill out step 1
        await user.type(screen.getByLabelText(/Nama Pemohon/i), 'Test User');
        
        await user.click(screen.getByRole('combobox', { name: /Cost Center/i }));
        await user.click(await screen.findByText(/IT Department/i));
        
        await user.click(screen.getByRole('combobox', { name: /Mata Uang/i }));
        await user.click(await screen.findByText('IDR'));

        // Go to next step
        await user.click(screen.getByRole('button', { name: /Selanjutnya/i }));
        await waitFor(() => expect(screen.getByText('Detail Item')).toBeInTheDocument());

        // Add an item
        await user.click(screen.getByRole('button', { name: /Tambah Item/i }));
        
        await user.click(screen.getAllByRole('combobox', { name: /Item/i })[0]);
        await user.click(await screen.findByText('Test Item'));

        await user.type(screen.getAllByLabelText(/Deskripsi/i)[0], 'Test Desc');
        const qtyInput = screen.getAllByLabelText(/Kuantitas/i)[0];
        await user.clear(qtyInput);
        await user.type(qtyInput, '10');
        
        const priceInput = screen.getAllByLabelText(/Harga Satuan/i)[0];
        await user.clear(priceInput);
        await user.type(priceInput, '1000');


        // Save draft
        const saveButton = screen.getByRole('button', { name: /Simpan Draft/i });
        await user.click(saveButton);
        
        await waitFor(() => {
            expect(screen.getByText('Draft PR berhasil disimpan.')).toBeInTheDocument();
        });
    });
});
