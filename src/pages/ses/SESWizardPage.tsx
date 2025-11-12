import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Check, File, FileCheck, Loader2, Plus, Receipt } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useGetPOs } from '@/api/hooks/usePO';
import { useAcceptSES } from '@/api/hooks/useSES';
import { PO, ServiceEntry, SELine } from '@/api/types/purchasing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// FIX: Imported `FormDescription` which was used in the component but not imported.
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Guard } from '@/app/guards/Guard';
import { PERMISSIONS } from '@/lib/permissions';
import { formatCurrency } from '@/lib/format';
import { Checkbox } from '@/components/ui/checkbox';

const lineSchema = z.object({
  poLineId: z.string(),
  description: z.string(),
  progressPercentage: z.coerce.number().min(0, "Progres harus positif").max(100, "Progres tidak boleh > 100%"),
  claimedAmount: z.coerce.number(),
});

const sesSchema = z.object({
  poId: z.string({ required_error: "PO harus dipilih." }),
  docDate: z.date(),
  retentionPercentage: z.coerce.number().min(0).max(100).default(0),
  lines: z.array(lineSchema).min(1, "Harus ada minimal satu baris layanan."),
  isAccepted: z.boolean().refine(val => val === true, {
    message: "Anda harus menyetujui penerimaan jasa ini."
  }),
});

type SESFormData = z.infer<typeof sesSchema>;

export default function SESWizardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [acceptedSES, setAcceptedSES] = useState<ServiceEntry | null>(null);

  const { data: poData, isLoading: isLoadingPOs } = useGetPOs({ status: 'RELEASED', poType: 'SERVICE', perPage: 999 });
  const acceptSESMutation = useAcceptSES();

  const form = useForm<SESFormData>({
    resolver: zodResolver(sesSchema),
    defaultValues: {
      docDate: new Date(),
      lines: [],
      retentionPercentage: 5, // Default retention 5%
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const linesWatch = useWatch({ control: form.control, name: 'lines' });
  const retentionWatch = useWatch({ control: form.control, name: 'retentionPercentage' });

  const handlePOSelect = (poId: string) => {
    const po = poData?.data.find(p => p.id === poId);
    if (po) {
      setSelectedPO(po);
      form.setValue('poId', po.id);
      const newLines = po.lines.map(line => ({
        poLineId: line.id,
        description: line.description,
        progressPercentage: 0,
        claimedAmount: 0,
      }));
      replace(newLines);
    }
  };
  
  // Real-time calculation
  React.useEffect(() => {
    if (!selectedPO) return;
    const subscription = form.watch((value, { name, type }) => {
      if (name?.startsWith('lines') && type === 'change') {
        const lineIndex = parseInt(name.split('.')[1]);
        const poLine = selectedPO.lines[lineIndex];
        if (poLine) {
            const progress = value.lines?.[lineIndex]?.progressPercentage ?? 0;
            const claimedAmount = (poLine.total * progress) / 100;
            form.setValue(`lines.${lineIndex}.claimedAmount`, claimedAmount, { shouldValidate: false });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, selectedPO]);

  const totalClaimed = linesWatch.reduce((acc, line) => acc + (line.claimedAmount || 0), 0);
  const retentionAmount = totalClaimed * (retentionWatch / 100);

  const onSubmit = (data: SESFormData) => {
    acceptSESMutation.mutate(data as Partial<ServiceEntry>, { // Cast for mock server
        onSuccess: (newSES) => {
            toast({ title: 'Sukses', description: 'SES berhasil diterima.' });
            setAcceptedSES(newSES);
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };
  
  const resetForm = () => {
    form.reset({ docDate: new Date(), lines: [], retentionPercentage: 5 });
    setSelectedPO(null);
    setAcceptedSES(null);
  }

  if (acceptedSES) {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
                 <FileCheck className="mx-auto h-16 w-16 text-green-500" />
                <CardTitle className="text-2xl">SES Berhasil Diterima</CardTitle>
                <CardDescription>Nomor Dokumen: <strong>{acceptedSES.docNo}</strong></CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
                <p>Penerimaan jasa telah berhasil dicatat dan disetujui. Siap untuk proses faktur termin.</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={resetForm}>
                         <Plus className="mr-2 h-4 w-4" />
                        Buat SES Baru Lagi
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/services/ses" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar SES
      </Link>
      <h1 className="text-2xl font-bold">Buat Service Entry Sheet (SES)</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Service PO</CardTitle>
          <CardDescription>Pilih PO Jasa yang sudah di-release untuk dicatat progresnya.</CardDescription>
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
                        <SelectValue placeholder="Pilih No. PO Jasa..." />
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
                <CardTitle>Detail Progres Layanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                     <FormField
                        control={form.control}
                        name="retentionPercentage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Persentase Retensi (%)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/2">Deskripsi Layanan</TableHead>
                            <TableHead className="text-right">Nilai Kontrak</TableHead>
                            <TableHead className="text-right w-[150px]">Progres (%)</TableHead>
                            <TableHead className="text-right">Nilai Termin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const poLine = selectedPO.lines.find(l => l.id === field.poLineId);
                            if (!poLine) return null;
                            return (
                                <TableRow key={field.id}>
                                    <TableCell>{poLine.description}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(poLine.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <FormField
                                            control={form.control}
                                            name={`lines.${index}.progressPercentage`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl><Input type="number" {...field} className="text-right" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(linesWatch[index]?.claimedAmount ?? 0)}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                <div className="mt-6 flex justify-end">
                    <div className="w-1/3 space-y-2">
                         <div className="flex justify-between font-semibold"><p>Total Termin:</p><p>{formatCurrency(totalClaimed)}</p></div>
                         <div className="flex justify-between text-sm"><p>Retensi ({retentionWatch}%):</p><p>{formatCurrency(retentionAmount)}</p></div>
                         <div className="flex justify-between font-bold text-lg"><p>Total Net:</p><p>{formatCurrency(totalClaimed - retentionAmount)}</p></div>
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <FormLabel>Lampiran Berita Acara</FormLabel>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                            <div className="text-center">
                                <File className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-sm text-gray-600">Unggah file (PDF, JPG, dll)</p>
                            </div>
                        </div>
                    </div>
                    <FormField
                        control={form.control}
                        name="isAccepted"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                               <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Persetujuan Penerimaan Jasa</FormLabel>
                                    <FormDescription>Dengan ini saya menyatakan progres pekerjaan telah sesuai dan dapat diterima.</FormDescription>
                                     <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
                <Guard can={PERMISSIONS.SES_ACCEPT}>
                    <Button type="submit" disabled={acceptSESMutation.isPending}>
                        {acceptSESMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit & Accept SES
                    </Button>
                </Guard>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}