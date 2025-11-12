import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '@/lib/hooks/useDebounce';

import { useGetPOs } from '@/api/hooks/usePO';
import { useGetGRNsByPO } from '@/api/hooks/useGRN';
import { useCreateInvoice, useCheckDuplicateInvoice } from '@/api/hooks/useInvoice';
import { useLookups } from '@/api/hooks/useLookups';
import { GoodsReceipt, Invoice, InvoiceLine, PO } from '@/api/types/purchasing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyInput } from '@/components/forms/CurrencyInput';
import { WithholdingSelect } from '@/components/forms/WithholdingSelect';
import { formatCurrency, formatDate } from '@/lib/format';
import { MatchViewer } from '@/components/MatchViewer/MatchViewer';

const lineSchema = z.object({
  grnLineId: z.string().optional(),
  seLineId: z.string().optional(),
  poLineId: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(0.01),
  price: z.coerce.number().min(0),
  total: z.number(),
});

const invoiceSchema = z.object({
  poId: z.string({ required_error: "PO harus dipilih." }),
  vendorId: z.string(),
  grnIds: z.array(z.string()).optional(),
  vendorInvoiceNo: z.string().min(1, "No. faktur vendor harus diisi."),
  docDate: z.date({ required_error: "Tgl. faktur harus diisi." }),
  dueDate: z.date({ required_error: "Tgl. jatuh tempo harus diisi." }),
  withholdingId: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Minimal harus ada satu baris item."),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceWizardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0: PO Select, 1: GRN/SES Select, 2: Header, 3: Details, 4: Match, 5: Review
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [selectedGRNs, setSelectedGRNs] = useState<GoodsReceipt[]>([]);
  const [grnLineSelection, setGrnLineSelection] = useState<Record<string, boolean>>({});

  const { data: poData, isLoading: isLoadingPOs } = useGetPOs({ status: 'RELEASED', perPage: 999 });
  const { data: grnsData, isLoading: isLoadingGRNs } = useGetGRNsByPO(selectedPO?.id ?? '');
  const { data: lookups, isLoading: isLoadingLookups } = useLookups();
  const createMutation = useCreateInvoice();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { docDate: new Date(), lines: [] },
  });

  const { fields, replace } = useFieldArray({ control: form.control, name: "lines" });
  const linesWatch = useWatch({ control: form.control, name: 'lines' });
  const vendorInvoiceNo = useWatch({ control: form.control, name: 'vendorInvoiceNo' });
  const debouncedVendorInvoiceNo = useDebounce(vendorInvoiceNo, 500);

  const { data: duplicateData, refetch: checkDuplicate } = useCheckDuplicateInvoice({
    vendorInvoiceNo: debouncedVendorInvoiceNo,
    vendorId: selectedPO?.vendorId,
  });

  useEffect(() => {
    if (debouncedVendorInvoiceNo && selectedPO?.vendorId) {
      checkDuplicate();
    }
  }, [debouncedVendorInvoiceNo, selectedPO, checkDuplicate]);
  
  const handlePOSelect = (poId: string) => {
    const po = poData?.data.find(p => p.id === poId);
    if (po) {
      setSelectedPO(po);
      form.setValue('poId', po.id);
      form.setValue('vendorId', po.vendorId);
      setStep(1);
    }
  };

  const handleGRNSelection = () => {
    const selectedGrnItems = grnsData?.flatMap(grn => grn.lines.filter(line => grnLineSelection[line.id])) ?? [];
    const invoiceLines = selectedGrnItems.map(grnLine => {
        const poLine = selectedPO?.lines.find(pl => pl.id === grnLine.poLineId);
        return {
            grnLineId: grnLine.id,
            poLineId: grnLine.poLineId,
            description: poLine?.description ?? 'N/A',
            quantity: grnLine.receivedQty,
            price: poLine?.price ?? 0,
            total: grnLine.receivedQty * (poLine?.price ?? 0)
        }
    });
    replace(invoiceLines as any);
    setSelectedGRNs(grnsData?.filter(grn => grn.lines.some(l => grnLineSelection[l.id])) ?? []);
    setStep(2);
  }

  const { subtotal, taxAmount, withholdingAmount, grandTotal } = useMemo(() => {
    const subtotal = linesWatch.reduce((acc, line) => acc + (line.quantity * line.price), 0);
    const tax = subtotal * (lookups?.taxes.find(t => t.id === 'tax-1')?.rate ?? 0.11);
    const withholdingRate = lookups?.withholdings.find(w => w.id === form.getValues('withholdingId'))?.rate ?? 0;
    const withholding = subtotal * withholdingRate;
    const grand = subtotal + tax - withholding;
    return { subtotal, taxAmount: tax, withholdingAmount: withholding, grandTotal: grand };
  }, [linesWatch, lookups, form.getValues('withholdingId')]);

  const onSubmit = (data: InvoiceFormData) => {
    const finalData = { ...data, subtotal, taxAmount, withholdingAmount, grandTotal, grnIds: selectedGRNs.map(g => g.id) };
    createMutation.mutate(finalData, {
      onSuccess: () => {
        toast({ title: 'Sukses', description: 'Faktur berhasil dibuat.' });
        navigate('/invoices');
      },
      onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
    });
  };

  const isLoading = isLoadingPOs || isLoadingLookups || isLoadingGRNs;

  const renderStepContent = () => {
    if (isLoading) return <Skeleton className="h-64 w-full" />;

    switch (step) {
      case 0:
        return (
          <Card>
            <CardHeader><CardTitle>Langkah 1: Pilih Purchase Order</CardTitle></CardHeader>
            <CardContent className="max-w-md">
              <Select onValueChange={handlePOSelect}>
                <SelectTrigger><SelectValue placeholder="Pilih No. PO..." /></SelectTrigger>
                <SelectContent>
                  {poData?.data.map(po => <SelectItem key={po.id} value={po.id}>{po.docNo} - {po.vendor?.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardHeader><CardTitle>Langkah 2: Pilih Item Diterima (GRN)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Pilih</TableHead><TableHead>No. GRN</TableHead><TableHead>Item</TableHead><TableHead>Qty Diterima</TableHead></TableRow></TableHeader>
                <TableBody>
                  {grnsData?.flatMap(grn => grn.lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell><Checkbox checked={!!grnLineSelection[line.id]} onCheckedChange={(checked) => setGrnLineSelection(prev => ({...prev, [line.id]: !!checked}))} /></TableCell>
                      <TableCell>{grn.docNo}</TableCell>
                      <TableCell>{selectedPO?.lines.find(pl => pl.id === line.poLineId)?.item?.name}</TableCell>
                      <TableCell>{line.receivedQty}</TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
              <Button onClick={handleGRNSelection} className="mt-4" disabled={!Object.values(grnLineSelection).some(v => v)}>Lanjutkan ke Detail Faktur</Button>
            </CardContent>
          </Card>
        );
      case 2:
        return (
            <Card>
                <CardHeader><CardTitle>Langkah 3: Detail Faktur</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     {duplicateData?.isDuplicate && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Peringatan: Potensi Duplikat</AlertTitle>
                            <AlertDescription>Faktur dengan nomor ini untuk vendor yang sama sudah ada. <Link to={`/invoices/view/${duplicateData.existingInvoiceId}`} className="underline">Lihat faktur</Link>.</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="vendorInvoiceNo" render={({ field }) => (<FormItem><FormLabel>No. Faktur Vendor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormDatePicker control={form.control} name="docDate" label="Tgl. Faktur" />
                        <FormDatePicker control={form.control} name="dueDate" label="Tgl. Jatuh Tempo" />
                        <WithholdingSelect control={form.control} name="withholdingId" label="Potongan PPh (opsional)" />
                    </div>
                </CardContent>
            </Card>
        );
      case 3:
         return (
            <Card>
                <CardHeader><CardTitle>Langkah 4: Rincian & Kalkulasi</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Deskripsi</TableHead><TableHead>Qty</TableHead><TableHead>Harga</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>{field.description}</TableCell>
                                <TableCell><FormField control={form.control} name={`lines.${index}.quantity`} render={({ field }) => <Input type="number" {...field} className="w-24" />} /></TableCell>
                                <TableCell><FormField control={form.control} name={`lines.${index}.price`} render={({ field }) => <CurrencyInput field={field} />} /></TableCell>
                                <TableCell>{formatCurrency(linesWatch[index]?.quantity * linesWatch[index]?.price)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <div className="mt-6 flex justify-end">
                        <div className="w-1/3 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">PPN (11%):</span><span>{formatCurrency(taxAmount)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Potongan PPh:</span><span>({formatCurrency(withholdingAmount)})</span></div>
                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span >Grand Total:</span><span>{formatCurrency(grandTotal)}</span></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
      case 4:
        const invoiceDraft: Invoice = { ...form.getValues(), subtotal, taxAmount, withholdingAmount, grandTotal } as Invoice;
        return (
            <Card>
                <CardHeader><CardTitle>Langkah 5: Perbandingan (Match Viewer)</CardTitle></CardHeader>
                <CardContent>
                    <MatchViewer po={selectedPO!} receipts={selectedGRNs} invoice={invoiceDraft} />
                </CardContent>
            </Card>
        )
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/invoices" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Faktur
      </Link>
      <h1 className="text-2xl font-bold">Buat Faktur Baru</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderStepContent()}
          <div className="flex justify-between mt-8">
            <Button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Sebelumnya
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => setStep(s => s + 1)} disabled={step >= 2 && !form.formState.isValid}>
                Selanjutnya <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending || duplicateData?.isDuplicate}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Faktur
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
