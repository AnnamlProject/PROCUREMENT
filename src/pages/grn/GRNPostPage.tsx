import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft, CheckCircle, FileCheck, Loader2, Plus, Receipt } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useGetPOs } from '@/api/hooks/usePO';
import { usePostGRN } from '@/api/hooks/useGRN';
import { GoodsReceipt, PO, QCResultStatus } from '@/api/types/purchasing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Guard } from '@/app/guards/Guard';
import { PERMISSIONS } from '@/lib/permissions';

const lineSchema = z.object({
  poLineId: z.string(),
  receivedQty: z.coerce.number().min(0, "Kuantitas diterima tidak boleh negatif."),
  location: z.string().optional(),
  batchNo: z.string().optional(),
  qcResult: z.enum(['PASS', 'HOLD', 'REJECT']),
  notes: z.string().optional(),
});

const grnSchema = z.object({
  poId: z.string({ required_error: "PO harus dipilih." }),
  deliveryOrderNo: z.string().min(1, "No. Surat Jalan harus diisi."),
  docDate: z.date(),
  lines: z.array(lineSchema).min(1, "Harus ada minimal satu item yang diterima."),
});

type GRNFormData = z.infer<typeof grnSchema>;

export default function GRNPostPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [postedGRN, setPostedGRN] = useState<GoodsReceipt | null>(null);

  const { data: poData, isLoading: isLoadingPOs } = useGetPOs({ status: 'RELEASED', perPage: 999 });
  const postGRNMutation = usePostGRN();

  const form = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      docDate: new Date(),
      lines: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const receivedQtys = useWatch({ control: form.control, name: 'lines' });

  const handlePOSelect = (poId: string) => {
    const po = poData?.data.find(p => p.id === poId);
    if (po) {
      setSelectedPO(po);
      form.setValue('poId', po.id);
      const newLines = po.lines.map(line => ({
        poLineId: line.id,
        receivedQty: 0,
        qcResult: 'PASS' as QCResultStatus,
        location: 'Gudang Utama',
        batchNo: '',
        notes: '',
      }));
      replace(newLines);
    }
  };

  const onSubmit = (data: GRNFormData) => {
    postGRNMutation.mutate(data, {
        onSuccess: (newGRN) => {
            toast({ title: 'Sukses', description: 'GRN berhasil di-posting.' });
            setPostedGRN(newGRN);
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };
  
  const resetForm = () => {
    form.reset({ docDate: new Date(), lines: [] });
    setSelectedPO(null);
    setPostedGRN(null);
  }

  if (postedGRN) {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
                 <FileCheck className="mx-auto h-16 w-16 text-green-500" />
                <CardTitle className="text-2xl">GRN Berhasil Diposting</CardTitle>
                <CardDescription>Nomor Dokumen: <strong>{postedGRN.docNo}</strong></CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
                <p>Penerimaan barang telah berhasil dicatat. Anda dapat melihat detail pencocokan atau membuat GRN baru.</p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate(`/purchasing/po/view/${postedGRN.poId}?tab=matching`)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Lihat Match
                    </Button>
                    <Button onClick={resetForm}>
                         <Plus className="mr-2 h-4 w-4" />
                        Buat GRN Baru Lagi
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/receiving/grn" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar GRN
      </Link>
      <h1 className="text-2xl font-bold">Buat Goods Receipt Note (GRN)</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Purchase Order</CardTitle>
          <CardDescription>Pilih PO yang sudah di-release untuk diterima barangnya.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPOs ? <Skeleton className="h-10 w-1/2" /> : (
            <FormField
              control={form.control}
              name="poId"
              render={({ field }) => (
                <FormItem className="max-w-md">
                  <Select onValueChange={handlePOSelect} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih No. PO..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {poData?.data.map(po => (
                        <SelectItem key={po.id} value={po.id}>{po.docNo} - {po.vendor?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {selectedPO && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detail Penerimaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                     <FormField
                        control={form.control}
                        name="deliveryOrderNo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>No. Surat Jalan Vendor</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/4">Item</TableHead>
                            <TableHead className="w-[100px]">Dipesan</TableHead>
                            <TableHead className="w-[150px]">Diterima</TableHead>
                            <TableHead>Lokasi</TableHead>
                            <TableHead>Batch/Serial</TableHead>
                            <TableHead>Hasil QC</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const poLine = selectedPO.lines.find(l => l.id === field.poLineId);
                            if (!poLine) return null;

                            const orderedQty = poLine.quantity;
                            const tolerance = selectedPO.tolerance ?? 0;
                            const maxQty = orderedQty * (1 + tolerance / 100);
                            const minQty = orderedQty * (1 - tolerance / 100);
                            const receivedQty = receivedQtys[index]?.receivedQty ?? 0;
                            const isOver = receivedQty > maxQty;
                            const isUnder = receivedQty > 0 && receivedQty < minQty;

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>{poLine.item?.name}</TableCell>
                                    <TableCell>{orderedQty} {poLine.uom?.name}</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`lines.${index}.receivedQty`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <Input type="number" {...field} />
                                                            {(isOver || isUnder) && <AlertTriangle className={cn("h-5 w-5", isOver && "text-red-500", isUnder && "text-yellow-500")} />}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <FormField control={form.control} name={`lines.${index}.location`} render={({ field }) => (<FormControl><Input {...field} /></FormControl>)} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`lines.${index}.batchNo`} render={({ field }) => (<FormControl><Input {...field} /></FormControl>)} />
                                    </TableCell>
                                    <TableCell>
                                         <FormField control={form.control} name={`lines.${index}.qcResult`} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PASS">Pass</SelectItem>
                                                    <SelectItem value="HOLD">Hold</SelectItem>
                                                    <SelectItem value="REJECT">Reject</SelectItem>
                                                </SelectContent>
                                            </Select>
                                         )} />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end">
                <Guard can={PERMISSIONS.GRN_POST}>
                    <Button type="submit" disabled={postGRNMutation.isPending}>
                        {postGRNMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post GRN
                    </Button>
                </Guard>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}