
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useGetPRs } from '@/api/hooks/usePR';
import { useCreateRFQ } from '@/api/hooks/useRFQ';
import { PR, PRLine, RFQLine } from '@/api/types/purchasing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { createBasicColumn, createCurrencyColumn, createDateColumn } from '@/components/DataTable/columns';
import { VendorPicker } from '@/components/forms/VendorPicker';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { DocStatus } from '@/api/types/core';
import { formatDate } from '@/lib/format';

const rfqSchema = z.object({
  selectedPRLineIds: z.record(z.boolean()).refine(val => Object.values(val).some(v => v), {
    message: "Minimal pilih satu item PR."
  }),
  invitedVendorIds: z.array(z.string()).min(1, "Minimal undang satu vendor."),
  deadline: z.date({ required_error: "Batas waktu harus diisi." }),
});

type RFQFormData = z.infer<typeof rfqSchema>;

const STEPS = [
  { id: 1, name: 'Pilih Item PR' },
  { id: 2, name: 'Undang Vendor' },
  { id: 3, name: 'Atur Batas Waktu' },
  { id: 4, name: 'Review & Publish' },
];

export default function RFQWizardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [allPRLines, setAllPRLines] = useState<PRLine[]>([]);

  const { data: prData, isLoading: isLoadingPRs } = useGetPRs({
    isApprovedForRfq: true,
    perPage: 999 // fetch all for selection
  });

  React.useEffect(() => {
    if (prData?.data) {
        const lines = prData.data.flatMap(pr => pr.lines.map(line => ({...line, prDocNo: pr.docNo}))) as (PRLine & {prDocNo?: string})[];
        setAllPRLines(lines);
    }
  }, [prData]);


  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      selectedPRLineIds: {},
      invitedVendorIds: [],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const selectedPRLineIds = form.watch('selectedPRLineIds');

  const selectedLines = useMemo(() => {
    return allPRLines.filter(line => selectedPRLineIds[line.id]);
  }, [allPRLines, selectedPRLineIds]);

  const createRFQMutation = useCreateRFQ();

  const handlePublish = async (data: RFQFormData) => {
    const linesToSubmit: Omit<RFQLine, 'id'| 'item' | 'uom'>[] = selectedLines.map(line => ({
        prSourceLineId: line.id,
        itemId: line.itemId,
        description: line.description,
        quantity: line.quantity,
        uomId: line.uomId,
        targetDate: line.requiredDate
    }));

    createRFQMutation.mutate({
        lines: linesToSubmit as any, // simplify for mock server
        invitedVendorIds: data.invitedVendorIds,
        deadline: data.deadline.toISOString(),
        prIds: [], // could be derived from selected lines in real app
    }, {
        onSuccess: () => {
            toast({ title: 'Sukses', description: 'RFQ berhasil dipublikasikan.' });
            navigate('/purchasing/rfq');
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof RFQFormData)[] =
      currentStep === 1 ? ['selectedPRLineIds'] : currentStep === 2 ? ['invitedVendorIds'] : [];
    
    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  
  if (isLoadingPRs) {
    return <Skeleton className="h-96 w-full" />;
  }

  const prLineColumns = useMemo<ColumnDef<PRLine & {prDocNo?: string}>[]>(() => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => {
                    table.toggleAllPageRowsSelected(!!value);
                    const currentIds = form.getValues('selectedPRLineIds');
                    table.getRowModel().rows.forEach(row => {
                       currentIds[row.original.id] = !!value;
                    });
                    form.setValue('selectedPRLineIds', currentIds);
                    form.trigger('selectedPRLineIds');
                }}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => {
                     row.toggleSelected(!!value);
                     const currentIds = form.getValues('selectedPRLineIds');
                     currentIds[row.original.id] = !!value;
                     form.setValue('selectedPRLineIds', currentIds);
                     form.trigger('selectedPRLineIds');
                }}
            />
        ),
    },
    createBasicColumn("prDocNo", "No. PR"),
    { accessorKey: "item.name", header: "Item" },
    createBasicColumn("description", "Deskripsi"),
    createBasicColumn("quantity", "Jml"),
    { accessorKey: "uom.name", header: "Satuan" },
    createCurrencyColumn("estimatedPrice", "Harga Estimasi"),
  ], [form]);

  return (
    <div className="space-y-6">
       <Link to="/purchasing/rfq" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar RFQ
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Buat Request for Quotation</h1>
          <p className="text-muted-foreground">Step {currentStep} dari {STEPS.length}.</p>
        </div>
      </div>

      <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
        {STEPS.map((step, stepIdx) => (
             <li key={step.name} className="relative md:flex md:flex-1">
              {step.id < currentStep ? (
                <div className="group flex w-full items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-6 w-6 text-white" />
                    </span>
                    <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                  </span>
                </div>
              ) : step.id === currentStep ? (
                <div className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary">
                    <span className="text-primary">{step.id}</span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-primary">{step.name}</span>
                </div>
              ) : (
                <div className="group flex items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                      <span className="text-gray-500">{step.id}</span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-gray-500">{step.name}</span>
                  </span>
                </div>
              )}
              {stepIdx !== STEPS.length - 1 ? (
                <div className="absolute right-0 top-0 hidden h-full w-5 md:block">
                  <svg className="h-full w-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
                    <path d="M0.5 0V80L22 40L0.5 0Z" vectorEffect="non-scaling-stroke" stroke="currentcolor" />
                  </svg>
                </div>
              ) : null}
            </li>
        ))}
        </ol>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handlePublish)} className="space-y-8">
          {currentStep === 1 && (
             <Card>
                <CardHeader>
                    <CardTitle>Pilih Item dari PR (Status: APPROVED)</CardTitle>
                    {form.formState.errors.selectedPRLineIds && <p className="text-sm text-destructive">{form.formState.errors.selectedPRLineIds.message}</p>}
                </CardHeader>
                <CardContent>
                    <DataTable 
                        columns={prLineColumns} 
                        data={allPRLines} 
                        isLoading={isLoadingPRs}
                        pageCount={1}
                        total={allPRLines.length}
                        queryState={{pageIndex: 0, pageSize: allPRLines.length, sorting: [], filters: []}}
                        setQueryState={() => {}} // dummy
                        isSimple
                    />
                </CardContent>
             </Card>
          )}

           {currentStep === 2 && (
            <Card>
              <CardHeader><CardTitle>Undang Vendor</CardTitle></CardHeader>
              <CardContent>
                <VendorPicker
                    value={form.getValues('invitedVendorIds')}
                    onChange={(ids) => form.setValue('invitedVendorIds', ids, { shouldValidate: true })}
                />
                 {form.formState.errors.invitedVendorIds && <p className="mt-2 text-sm text-destructive">{form.formState.errors.invitedVendorIds.message}</p>}
              </CardContent>
            </Card>
          )}

           {currentStep === 3 && (
                <Card>
                    <CardHeader><CardTitle>Atur Batas Waktu Penawaran</CardTitle></CardHeader>
                    <CardContent className="max-w-xs">
                        <FormDatePicker
                            control={form.control}
                            name="deadline"
                            label="Deadline"
                        />
                    </CardContent>
                </Card>
           )}

           {currentStep === 4 && (
                <Card>
                    <CardHeader><CardTitle>Review & Publish RFQ</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p>Anda akan membuat RFQ dengan <strong>{selectedLines.length} item</strong> dan mengundang <strong>{form.getValues('invitedVendorIds').length} vendor</strong>. Batas waktu penawaran adalah <strong>{formatDate(form.getValues('deadline'))}</strong>.</p>
                        <p>Silakan periksa kembali sebelum mempublikasikan.</p>
                        <Button type="submit" disabled={createRFQMutation.isPending}>
                            {createRFQMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Publish RFQ
                        </Button>
                    </CardContent>
                </Card>
           )}
        </form>
      </Form>
      
      <div className="flex justify-between mt-8">
        <Button onClick={prevStep} disabled={currentStep === 1}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Sebelumnya
        </Button>
        <Button onClick={nextStep} disabled={currentStep === STEPS.length}>
          Selanjutnya
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
