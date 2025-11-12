import { useGetInvoice, useApproveInvoice } from '@/api/hooks/useInvoice';
import { useGetPO } from '@/api/hooks/usePO';
import { useGetGRNsByPO } from '@/api/hooks/useGRN';
import { DocStatus } from '@/api/types/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Guard } from '@/app/guards/Guard';
import { formatCurrency, formatDate } from '@/lib/format';
import { PERMISSIONS } from '@/lib/permissions';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { MatchViewer } from '@/components/MatchViewer/MatchViewer';

export default function InvoiceViewPage() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    
    const { data: invoice, isLoading: isLoadingInvoice, isError } = useGetInvoice(id);
    const { data: po, isLoading: isLoadingPO } = useGetPO(invoice?.poId ?? null);
    const { data: grns, isLoading: isLoadingGRNs } = useGetGRNsByPO(invoice?.poId ?? '');

    const approveMutation = useApproveInvoice();

    const handleApprove = () => {
        if (!invoice) return;
        approveMutation.mutate(invoice.id, {
            onSuccess: () => {
                toast({ title: 'Sukses', description: 'Faktur berhasil disetujui.' });
            },
            onError: (error) => {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        });
    }

    if (isLoadingInvoice || isLoadingPO || isLoadingGRNs) {
        return <div className="space-y-4"><Skeleton className="h-96 w-full" /></div>;
    }

    if (isError || !invoice || !po) {
        return <p>Gagal memuat atau faktur tidak ditemukan.</p>;
    }

    return (
        <div className="space-y-6">
            <Link to="/invoices" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Faktur
            </Link>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Detail Faktur: {invoice.vendorInvoiceNo}</h1>
                    <Badge variant={invoice.status === DocStatus.APPROVED ? 'default' : 'secondary'}>{invoice.status}</Badge>
                </div>
                <Guard can={PERMISSIONS.INVOICE_APPROVE}>
                     <Button onClick={handleApprove} disabled={approveMutation.isPending || invoice.status !== DocStatus.SUBMITTED}>
                        {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Setujui Faktur
                    </Button>
                </Guard>
            </div>

            <Tabs defaultValue="details">
                <TabsList>
                    <TabsTrigger value="details">Detail Faktur</TabsTrigger>
                    <TabsTrigger value="matching">Matching</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                     <div className="space-y-4 mt-4">
                        <Card>
                            <CardHeader><CardTitle>Informasi Umum</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-3 gap-4 text-sm">
                                <div><span className="font-semibold text-muted-foreground">Vendor:</span> {invoice.vendor?.name}</div>
                                <div><span className="font-semibold text-muted-foreground">No. PO:</span> {invoice.po?.docNo}</div>
                                <div><span className="font-semibold text-muted-foreground">Tanggal Faktur:</span> {formatDate(invoice.docDate!)}</div>
                                <div><span className="font-semibold text-muted-foreground">Jatuh Tempo:</span> {formatDate(invoice.dueDate!)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Detail Item</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead className="text-right">Kuantitas</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.lines.map(line => (
                                            <TableRow key={line.id}>
                                                <TableCell>{line.description}</TableCell>
                                                <TableCell className="text-right">{line.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(line.price)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(line.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Card className="w-1/3">
                                <CardContent className="p-4 space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span> <span>{formatCurrency(invoice.subtotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Pajak:</span> <span>{formatCurrency(invoice.taxes.reduce((a, t) => a + t.taxAmount, 0))}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Potongan PPh:</span> <span>({formatCurrency(invoice.withholdingAmount ?? 0)})</span></div>
                                    <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t"><span >Grand Total:</span> <span>{formatCurrency(invoice.grandTotal)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                     </div>
                </TabsContent>
                <TabsContent value="matching">
                    <MatchViewer po={po} receipts={grns} invoice={invoice} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
