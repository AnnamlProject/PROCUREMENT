import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { addDays, formatISO } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Loader2, Send } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useGetInvoices } from '@/api/hooks/useInvoice';
import { useExecutePaymentRun } from '@/api/hooks/usePayment';
import { Invoice } from '@/api/types/purchasing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { DataTable } from '@/components/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { createBasicColumn, createCurrencyColumn, createDateColumn } from '@/components/DataTable/columns';
import { DocStatus } from '@/api/types/core';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Guard } from '@/app/guards/Guard';
import { PERMISSIONS } from '@/lib/permissions';

const filterSchema = z.object({
  dueDateFrom: z.date(),
  dueDateTo: z.date(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export default function PaymentRunPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0: filter, 1: select, 2: review
  const [filters, setFilters] = useState<any>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [rowSelection, setRowSelection] = useState({});

  const filterForm = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      dueDateFrom: new Date(),
      dueDateTo: addDays(new Date(), 30),
    },
  });

  const { data: invoiceData, isLoading: isLoadingInvoices, isFetching } = useGetInvoices({
    ...filters,
    status: DocStatus.APPROVED,
    paymentStatus: 'UNPAID',
    perPage: 999,
  });

  const executeMutation = useExecutePaymentRun();

  const handleFindInvoices = (data: FilterFormData) => {
    setFilters({
      dueDateFrom: formatISO(data.dueDateFrom, { representation: 'date' }),
      dueDateTo: formatISO(data.dueDateTo, { representation: 'date' }),
    });
    setStep(1);
  };
  
  const handleSelectionChange = (table: any) => {
    const selectedRows = table.getSelectedRowModel().rows.map((row: any) => row.original as Invoice);
    setSelectedInvoices(selectedRows);
    setRowSelection(table.getState().rowSelection);
  };
  
  const totalSelectedAmount = useMemo(() => {
    return selectedInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  }, [selectedInvoices]);

  const handleExecutePayment = () => {
    const payload = {
        invoiceIds: selectedInvoices.map(inv => inv.id),
        bankFee: 0, // Placeholder
    };
    executeMutation.mutate(payload, {
        onSuccess: () => {
            toast({ title: 'Sukses', description: 'Pembayaran berhasil dieksekusi.' });
            navigate('/payments');
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  }

  const handleExportCsv = () => {
     if (selectedInvoices.length === 0) {
        toast({ title: 'Info', description: 'Pilih minimal satu faktur untuk diekspor.' });
        return;
    }
    const headers = ['beneficiary_name', 'beneficiary_account', 'amount', 'currency', 'invoice_ref'];
    const csvContent = [
        headers.join(','),
        ...selectedInvoices.map(inv => [
            inv.vendor?.name.replace(/,/g, ''),
            '1234567890', // mock account
            inv.grandTotal,
            'IDR',
            inv.vendorInvoiceNo
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `payment-run-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const invoiceColumns = useMemo<ColumnDef<Invoice>[]>(() => [
     {
        id: 'select',
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />,
     },
     createBasicColumn("vendorInvoiceNo", "No. Faktur Vendor"),
     { accessorKey: "vendor.name", header: "Vendor" },
     createDateColumn("dueDate", "Jatuh Tempo"),
     createCurrencyColumn("grandTotal", "Nilai"),
  ], []);

  const renderContent = () => {
    if (step === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Proposal Pembayaran</CardTitle>
            <CardDescription>Pilih rentang tanggal jatuh tempo untuk mencari faktur yang siap dibayar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...filterForm}>
              <form onSubmit={filterForm.handleSubmit(handleFindInvoices)} className="flex items-end gap-4">
                <FormDatePicker control={filterForm.control} name="dueDateFrom" label="Jatuh Tempo Dari" />
                <FormDatePicker control={filterForm.control} name="dueDateTo" label="Jatuh Tempo Sampai" />
                <Button type="submit">Cari Faktur</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      );
    }

    if (step === 1) {
      return (
         <Card>
            <CardHeader>
                <CardTitle>Pilih Faktur untuk Dibayar</CardTitle>
            </CardHeader>
            <CardContent>
                 <DataTable
                    columns={invoiceColumns}
                    data={invoiceData?.data ?? []}
                    isLoading={isLoadingInvoices || isFetching}
                    pageCount={invoiceData?.meta?.totalPages ?? 0}
                    total={invoiceData?.meta?.total ?? 0}
                    queryState={{ pageIndex: 0, pageSize: 999, sorting: [], filters: [] }} // Simplified for wizard
                    setQueryState={() => {}}
                    onSelectionChange={handleSelectionChange}
                    rowSelection={rowSelection}
                />
                 <div className="mt-4 text-right">
                    <p className="text-muted-foreground">Total Dipilih:</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalSelectedAmount)}</p>
                </div>
            </CardContent>
         </Card>
      );
    }
    
    if (step === 2) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Review & Eksekusi Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Total Faktur Dipilih</p>
                        <p className="text-lg font-semibold">{selectedInvoices.length}</p>
                    </div>
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Total Nilai Pembayaran</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalSelectedAmount)}</p>
                    </div>
                     <FormItem className="max-w-xs">
                        <FormLabel>Biaya Bank (Opsional)</FormLabel>
                        <Input type="number" defaultValue={0} />
                    </FormItem>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleExportCsv}><Download className="mr-2 h-4 w-4" /> Ekspor File Bank (CSV)</Button>
                        <Guard can={PERMISSIONS.PAYMENT_EXECUTE}>
                            <Button onClick={handleExecutePayment} disabled={executeMutation.isPending}>
                                {executeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Eksekusi Pembayaran
                            </Button>
                        </Guard>
                    </div>
                </CardContent>
            </Card>
        )
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/payments" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Pembayaran
      </Link>
      <h1 className="text-2xl font-bold">Buat Pembayaran (Payment Run)</h1>
      
      {renderContent()}

      <div className="flex justify-between mt-8">
        <Button onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Sebelumnya
        </Button>
        <Button onClick={() => setStep(s => s + 1)} disabled={step >= 2 || (step === 1 && selectedInvoices.length === 0)}>
          Selanjutnya
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
