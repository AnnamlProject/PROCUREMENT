
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  File,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
  Controller,
} from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useGetPR, useCreatePR, useUpdatePR, useSubmitPR } from '@/api/hooks/usePR';
import { useLookups } from '@/api/hooks/useLookups';
import { PR, PRLine } from '@/api/types/purchasing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { ItemPicker } from '@/components/forms/ItemPicker';
import { CurrencyInput } from '@/components/forms/CurrencyInput';
import { TaxSelect } from '@/components/forms/TaxSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormSelect } from '@/components/forms/FormSelect';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useBudgetCheck } from '@/api/hooks/useBudgetCheck';
import { DocStatus } from '@/api/types/core';

const lineSchema = z.object({
  id: z.string().optional(),
  itemId: z.string({ required_error: 'Item harus dipilih.' }),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong.'),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0.'),
  uomId: z.string(),
  estimatedPrice: z.coerce.number().min(0, 'Harga tidak boleh negatif.'),
  taxId: z.string().optional(),
  total: z.number(),
  requiredDate: z.date({ required_error: 'Tanggal dibutuhkan harus diisi.' }),
});

const prSchema = z.object({
  id: z.string().optional(),
  requesterName: z.string().min(1, 'Nama pemohon harus diisi.'),
  docDate: z.date({ required_error: 'Tanggal dokumen harus diisi.' }),
  costCenterId: z.string({ required_error: 'Cost center harus dipilih.' }),
  projectId: z.string().optional(),
  currencyId: z.string({ required_error: 'Mata uang harus dipilih.' }),
  remarks: z.string().optional(),
  lines: z
    .array(lineSchema)
    .min(1, 'Minimal harus ada satu baris item.'),
  totalAmount: z.number(),
});

type PRFormData = z.infer<typeof prSchema>;

const STEPS = [
  { id: 1, name: 'Header' },
  { id: 2, name: 'Detail Item' },
  { id: 3, name: 'Lampiran & Catatan' },
  { id: 4, name: 'Review & Submit' },
];

export default function PREditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const isNew = !id;
  const { data: prData, isLoading: isLoadingPR } = useGetPR(id);
  const { data: lookups, isLoading: isLoadingLookups } = useLookups();

  const form = useForm<PRFormData>({
    resolver: zodResolver(prSchema),
    defaultValues: {
      requesterName: '',
      docDate: new Date(),
      lines: [],
      totalAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const linesWatch = useWatch({ control: form.control, name: 'lines' });
  const costCenterWatch = useWatch({ control: form.control, name: 'costCenterId' });

  const totalAmount = useDebounce(
    linesWatch.reduce((acc, line) => acc + (line.total || 0), 0),
    500
  );

  const {
    data: budgetData,
    refetch: checkBudget,
    isFetching: isCheckingBudget,
  } = useBudgetCheck(costCenterWatch, totalAmount);
  
  const isReadOnly = prData?.status !== DocStatus.DRAFT && !isNew;

  useEffect(() => {
    if (prData) {
      form.reset({
        ...prData,
        docDate: new Date(prData.docDate!),
        lines: prData.lines.map((line) => ({
          ...line,
          taxId: 'tax-1', // default PPN 11% for demo
          requiredDate: new Date(line.requiredDate),
        })),
      });
    }
  }, [prData, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('lines')) {
        const lines = value.lines || [];
        const newTotal = lines.reduce((acc, line) => {
          const taxRate =
            lookups?.taxes.find((t) => t.id === line?.taxId)?.rate || 0;
          const subtotal = (line?.quantity || 0) * (line?.estimatedPrice || 0);
          const taxAmount = subtotal * taxRate;
          const newTotal = subtotal + taxAmount;
          // Avoid re-render loop by checking if value is different
          if (newTotal !== line?.total) {
            form.setValue(`lines.${lines.indexOf(line!)}.total`, newTotal, {
              shouldValidate: false,
            });
          }
          return acc + newTotal;
        }, 0);
        form.setValue('totalAmount', newTotal);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, lookups]);
  
  // Budget Check trigger
  useEffect(() => {
     if(costCenterWatch && totalAmount > 0) {
        checkBudget();
     }
  }, [costCenterWatch, totalAmount, checkBudget]);


  const createMutation = useCreatePR();
  const updateMutation = useUpdatePR();
  const submitMutation = useSubmitPR();

  const isMutating = createMutation.isPending || updateMutation.isPending || submitMutation.isPending;

  const handleSaveDraft = (data: PRFormData) => {
    const mutation = isNew ? createMutation : updateMutation;
    mutation.mutate(data as any, {
      onSuccess: (savedData) => {
        toast({ title: 'Sukses', description: 'Draft PR berhasil disimpan.' });
        if (isNew) {
          navigate(`/purchasing/pr/edit/${savedData.id}`);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleSubmitPR = (data: PRFormData) => {
    if (!id) return;
    submitMutation.mutate(id, {
        onSuccess: () => {
             toast({ title: 'Sukses', description: 'PR berhasil di-submit.' });
             navigate('/purchasing/pr');
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    })
  }

  const triggerValidation = async () => {
    const fieldsToValidate: (keyof PRFormData)[] =
      currentStep === 1
        ? ['requesterName', 'docDate', 'costCenterId', 'currencyId']
        : currentStep === 2
        ? ['lines']
        : [];
    
    if (fieldsToValidate.length > 0) {
      return await form.trigger(fieldsToValidate);
    }
    return true;
  };

  const nextStep = async () => {
    const isValid = await triggerValidation();
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  
  if (isLoadingPR || isLoadingLookups) {
    return (
       <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Link
        to="/purchasing/pr"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar PR
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? 'Buat Purchase Requisition Baru' : `Ubah PR: ${prData?.docNo || ''}`}
          </h1>
          <p className="text-muted-foreground">
            Lengkapi form di bawah ini. Step {currentStep} dari {STEPS.length}.
          </p>
        </div>
        {!isReadOnly && (
            <div className="flex gap-2">
                 <Button variant="outline" onClick={form.handleSubmit(handleSaveDraft)} disabled={isMutating}>
                    {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Draft
                </Button>
                 <Button onClick={form.handleSubmit(handleSubmitPR)} disabled={isNew || isMutating || budgetData?.isSufficient === false}>
                    {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit PR
                </Button>
            </div>
        )}
      </div>

      <nav aria-label="Progress">
        <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
          {STEPS.map((step, stepIdx) => (
            <li key={step.name} className="relative md:flex md:flex-1">
              {step.id < currentStep ? (
                <div className="group flex w-full items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-6 w-6 text-white" aria-hidden="true" />
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
                <div className="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
                  <svg className="h-full w-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
                    <path d="M0.5 0V80L22 40L0.5 0Z" vectorEffect="non-scaling-stroke" stroke="currentcolor" />
                  </svg>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <Form {...form}>
        <form className="space-y-8">
          {currentStep === 1 && (
             <Card>
                <CardHeader><CardTitle>Informasi Header</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="requesterName" render={({ field }) => (
                        <FormItem><FormLabel>Nama Pemohon</FormLabel><FormControl><Input {...field} disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormDatePicker control={form.control} name="docDate" label="Tanggal Dokumen" disabled={isReadOnly}/>
                     <FormSelect control={form.control} name="costCenterId" label="Cost Center" placeholder="Pilih Cost Center" options={lookups?.costCenters.map(c => ({value: c.id, label: `${c.code} - ${c.name}`})) ?? []} disabled={isReadOnly} />
                     <FormSelect control={form.control} name="projectId" label="Project (Opsional)" placeholder="Pilih Project" options={lookups?.projects.map(p => ({value: p.id, label: `${p.code} - ${p.name}`})) ?? []} disabled={isReadOnly} />
                     <FormSelect control={form.control} name="currencyId" label="Mata Uang" placeholder="Pilih Mata Uang" options={lookups?.currencies.map(c => ({value: c.id, label: c.code})) ?? []} disabled={isReadOnly} />
                </CardContent>
             </Card>
          )}

           {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Item</CardTitle>
                <CardDescription>
                  Tambahkan item yang dibutuhkan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start rounded-md border p-4">
                        <div className="col-span-12 md:col-span-4">
                            <FormField control={form.control} name={`lines.${index}.itemId`} render={({ field }) => (
                                <FormItem><FormLabel>Item</FormLabel><FormControl><ItemPicker value={field.value} onChange={field.onChange} disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <div className="col-span-12 md:col-span-8">
                            <FormField control={form.control} name={`lines.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Input {...field} disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                            <FormField control={form.control} name={`lines.${index}.quantity`} render={({ field }) => (
                                <FormItem><FormLabel>Kuantitas</FormLabel><FormControl><Input type="number" {...field} disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                             <FormField control={form.control} name={`lines.${index}.uomId`} render={({ field }) => (
                                <FormItem><FormLabel>Satuan</FormLabel><FormControl>
                                    <Controller
                                        control={form.control}
                                        name={`lines.${index}.uomId`}
                                        render={({ field }) => (
                                            <Input value={lookups?.uoms.find(u => u.id === linesWatch[index]?.item?.uomId)?.name ?? ''} disabled />
                                        )}
                                    />
                                </FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <div className="col-span-4 md:col-span-2">
                             <FormField control={form.control} name={`lines.${index}.estimatedPrice`} render={({ field }) => (
                                <FormItem><FormLabel>Harga Satuan</FormLabel><FormControl><CurrencyInput field={field} disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <TaxSelect control={form.control} name={`lines.${index}.taxId`} label="Pajak" disabled={isReadOnly} />
                        </div>
                         <div className="col-span-6 md:col-span-2">
                            <FormDatePicker control={form.control} name={`lines.${index}.requiredDate`} label="Tgl Dibutuhkan" disabled={isReadOnly} />
                        </div>
                        <div className="col-span-10">
                            <p className="text-sm font-medium text-right mt-8">Total Baris: {formatCurrency(linesWatch[index]?.total || 0)}</p>
                        </div>
                        <div className="col-span-2 flex items-end justify-end">
                            {!isReadOnly && <Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                    </div>
                  ))}
                </div>
                 {!isReadOnly && (
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ itemId: '', description: '', quantity: 1, uomId: '', estimatedPrice: 0, total: 0, requiredDate: new Date(), taxId: 'tax-1'})}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Item
                    </Button>
                 )}
                 <div className="mt-6 text-right text-xl font-bold">
                    Total Keseluruhan: {formatCurrency(form.getValues('totalAmount'))}
                 </div>
              </CardContent>
            </Card>
          )}

           {currentStep === 3 && (
                <Card>
                    <CardHeader><CardTitle>Lampiran & Catatan</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <FormLabel>Lampiran</FormLabel>
                            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                                <div className="text-center">
                                    <File className="mx-auto h-12 w-12 text-gray-300" />
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
                                            <span>Unggah file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" disabled={isReadOnly} />
                                        </label>
                                        <p className="pl-1">atau tarik dan lepas</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600">PNG, JPG, PDF up to 10MB</p>
                                </div>
                            </div>
                        </div>
                        <FormField control={form.control} name="remarks" render={({ field }) => (
                            <FormItem><FormLabel>Catatan / Keterangan</FormLabel><FormControl><Textarea rows={5} {...field} disabled={isReadOnly} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
           )}

           {currentStep === 4 && (
                <Card>
                    <CardHeader><CardTitle>Review & Submit</CardTitle><CardDescription>Periksa kembali semua data sebelum melanjutkan.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        {isCheckingBudget ? (
                            <Skeleton className="h-12 w-full" />
                        ) : budgetData ? (
                            <div className={`p-4 rounded-md text-sm ${budgetData.isSufficient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                               <div className="flex items-center gap-2">
                                {budgetData.isSufficient ? <Check className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
                                <span className="font-bold">Hasil Pengecekan Budget</span>
                               </div>
                               <p className="mt-1">
                                    Total PR: {formatCurrency(totalAmount)}. Sisa Budget: {formatCurrency(budgetData.remainingBudget)}.
                                    Status: <span className="font-semibold">{budgetData.isSufficient ? 'CUKUP' : 'TIDAK CUKUP'}</span>
                                </p>
                            </div>
                        ) : null}

                         <div>
                            <h3 className="font-semibold">Informasi Header</h3>
                            <dl className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200">
                                <div className="flex justify-between py-3 text-sm font-medium"><dt className="text-gray-500">Pemohon</dt><dd className="text-gray-900">{form.getValues('requesterName')}</dd></div>
                                <div className="flex justify-between py-3 text-sm font-medium"><dt className="text-gray-500">Tanggal</dt><dd className="text-gray-900">{formatDate(form.getValues('docDate'))}</dd></div>
                                <div className="flex justify-between py-3 text-sm font-medium"><dt className="text-gray-500">Cost Center</dt><dd className="text-gray-900">{lookups?.costCenters.find(c => c.id === form.getValues('costCenterId'))?.name}</dd></div>
                            </dl>
                        </div>
                         <div>
                            <h3 className="font-semibold">Detail Item</h3>
                             <ul role="list" className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200">
                                {form.getValues('lines').map((line, index) => (
                                    <li key={index} className="flex items-center justify-between py-3">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{lookups?.items.find(i => i.id === line.itemId)?.name}</p>
                                            <p className="text-gray-500">{line.quantity} x {formatCurrency(line.estimatedPrice)}</p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{formatCurrency(line.total)}</p>
                                    </li>
                                ))}
                             </ul>
                        </div>
                        <div className="flex justify-end text-xl font-bold">
                            Total: {formatCurrency(form.getValues('totalAmount'))}
                        </div>
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
