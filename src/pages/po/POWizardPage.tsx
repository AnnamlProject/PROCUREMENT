
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useGetRFQs } from '@/api/hooks/useRFQ';
import { useCreatePO } from '@/api/hooks/usePO';
import { useLookups } from '@/api/hooks/useLookups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorPicker } from '@/components/forms/VendorPicker';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { PO, POLine } from '@/api/types/purchasing';
import { formatCurrency } from '@/lib/format';
import { CurrencyInput } from '@/components/forms/CurrencyInput';
import { ItemPicker } from '@/components/forms/ItemPicker';
import { TaxSelect } from '@/components/forms/TaxSelect';

const scheduleSchema = z.object({
  deliveryDate: z.date(),
  quantity: z.coerce.number().min(0.01),
});

const lineSchema = z.object({
  itemId: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(0.01),
  uomId: z.string(),
  price: z.coerce.number().min(0),
  taxId: z.string().optional(),
  total: z.number(),
  schedules: z.array(scheduleSchema).optional(),
});

const poSchema = z.object({
  poType: z.enum(['STANDARD', 'BLANKET', 'SERVICE']),
  sourceRfqId: z.string().optional(),
  vendorId: z.string({ required_error: "Vendor harus dipilih." }),
  docDate: z.date(),
  paymentTerms: z.string().min(1, "Syarat pembayaran harus diisi."),
  deliveryAddress: z.string().min(1, "Alamat pengiriman harus diisi."),
  currencyId: z.string(),
  lines: z.array(lineSchema).optional(),
  // Blanket fields
  valueLimit: z.coerce.number().optional(),
  validityStartDate: z.date().optional(),
  validityEndDate: z.date().optional(),
});

type POFormData = z.infer<typeof poSchema>;

export default function POWizardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0: Source selection, 1: Header, 2: Lines, 3: Review

  const form = useForm<POFormData>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poType: 'STANDARD',
      docDate: new Date(),
      lines: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  
  const poType = form.watch('poType');
  const sourceRfqId = form.watch('sourceRfqId');
  const linesWatch = form.watch('lines');

  const { data: lookups, isLoading: isLoadingLookups } = useLookups();
  const { data: rfqsData, isLoading: isLoadingRfqs } = useGetRFQs({ status: 'CLOSED', perPage: 100 });
  
  const createMutation = useCreatePO();

  useEffect(() => {
    if (sourceRfqId) {
      const rfq = rfqsData?.data.find(r => r.id === sourceRfqId);
      if (rfq && rfq.awardedVendors) {
        // For simplicity, we assign the first awarded vendor to the PO.
        // A real-world scenario might create multiple POs if awards are split.
        form.setValue('vendorId', rfq.awardedVendors[0].vendorId);

        const newLines = rfq.awardedVendors.map(award => {
            const rfqLine = rfq.lines.find(l => l.id === award.rfqLineId);
            if (!rfqLine) return null;
            const subtotal = award.awardedQty * award.price;
            const taxRate = lookups?.taxes.find(t => t.id === 'tax-1')?.rate ?? 0.11;
            const total = subtotal * (1 + taxRate);

            return {
                itemId: rfqLine.item.id,
                description: rfqLine.description,
                quantity: award.awardedQty,
                uomId: rfqLine.uom.id,
                price: award.price,
                taxId: 'tax-1', // Default tax
                total,
                schedules: [{ deliveryDate: new Date(), quantity: award.awardedQty }]
            };
        }).filter(Boolean) as POLine[];
        form.setValue('lines', newLines as any);
      }
    }
  }, [sourceRfqId, rfqsData, form, lookups]);
  
  const onSubmit = (data: POFormData) => {
    const subtotal = data.lines?.reduce((acc, line) => acc + (line.quantity * line.price), 0) ?? 0;
    const taxAmount = data.lines?.reduce((acc, line) => {
        const taxRate = lookups?.taxes.find(t => t.id === line.taxId)?.rate ?? 0;
        return acc + (line.quantity * line.price * taxRate);
    }, 0) ?? 0;
    const grandTotal = subtotal + taxAmount;

    createMutation.mutate({ ...data, subtotal, taxAmount, grandTotal }, {
        onSuccess: () => {
            toast({ title: 'Sukses', description: 'PO berhasil dibuat.' });
            navigate('/purchasing/po');
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  if (isLoadingLookups || isLoadingRfqs) {
    return <Skeleton className="h-96 w-full" />;
  }

  const renderStep = () => {
    switch (step) {
      case 0: // Source Selection
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pilih Sumber Pembuatan PO</CardTitle>
              <CardDescription>Bagaimana Anda ingin membuat PO ini?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="sourceRfqId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dari RFQ yang sudah di-Award</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih RFQ..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rfqsData?.data.map(rfq => (
                          <SelectItem key={rfq.id} value={rfq.id}>{rfq.docNo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
               <div className="flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">ATAU</span>
                </div>
               <FormField
                control={form.control}
                name="poType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buat PO jenis lain secara manual</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Tipe PO" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="STANDARD">Standard (dari PR / Manual)</SelectItem>
                         <SelectItem value="BLANKET">Blanket (Batas Nilai)</SelectItem>
                         <SelectItem value="SERVICE">Service (Jasa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );
      case 1: // Header
        return (
          <Card>
            <CardHeader><CardTitle>Informasi Header PO</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="vendorId" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Vendor</FormLabel>
                     <VendorPicker value={[field.value]} onChange={(ids) => field.onChange(ids[0] || '')} isMulti={false}/>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormDatePicker control={form.control} name="docDate" label="Tanggal PO" />
              <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem><FormLabel>Syarat Pembayaran</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Alamat Pengiriman</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>
        );
      case 2: // Lines
        return (
          <Card>
             <CardHeader><CardTitle>Detail Item PO</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start rounded-md border p-4">
                        <div className="col-span-4"><FormField control={form.control} name={`lines.${index}.itemId`} render={({ field }) => (<FormItem><FormLabel>Item</FormLabel><FormControl><ItemPicker {...field} /></FormControl></FormItem>)} /></div>
                        <div className="col-span-8"><FormField control={form.control} name={`lines.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                        <div className="col-span-2"><FormField control={form.control} name={`lines.${index}.quantity`} render={({ field }) => (<FormItem><FormLabel>Kuantitas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} /></div>
                        <div className="col-span-2"><FormField control={form.control} name={`lines.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Harga</FormLabel><FormControl><CurrencyInput field={field} /></FormControl></FormItem>)} /></div>
                        <div className="col-span-2"><TaxSelect control={form.control} name={`lines.${index}.taxId`} label="Pajak" /></div>
                        <div className="col-span-4"><FormLabel>Jadwal Pengiriman</FormLabel><Button size="sm" variant="outline" className="mt-2"><Plus className="mr-2 h-4 w-4" />Tambah Jadwal</Button></div>
                        <div className="col-span-2 flex items-end justify-end"><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                    </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: '', description: '', quantity: 1, uomId: '', price: 0, total: 0, taxId: 'tax-1' })}>Tambah Item</Button>
                 <div className="mt-6 text-right text-xl font-bold">
                    Grand Total: {formatCurrency(linesWatch.reduce((acc, l) => acc + l.total, 0))}
                 </div>
             </CardContent>
          </Card>
        )
      case 3: // Review
        return (
            <Card>
                <CardHeader><CardTitle>Review & Simpan PO</CardTitle></CardHeader>
                <CardContent>
                    <p>Harap periksa kembali semua detail sebelum menyimpan Purchase Order.</p>
                </CardContent>
            </Card>
        )
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/purchasing/po" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar PO
      </Link>
      <h1 className="text-2xl font-bold">Buat Purchase Order Baru</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderStep()}
          <div className="flex justify-between mt-8">
            <Button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Sebelumnya
            </Button>
            {step < 3 ? (
                <Button type="button" onClick={() => setStep(s => s + 1)}>
                    Selanjutnya<ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                 <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Simpan PO
                </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
