
import { useGetPO, useReleasePO } from '@/api/hooks/usePO';
import { DocStatus } from '@/api/types/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Guard } from '@/app/guards/Guard';
import { formatCurrency, formatDate } from '@/lib/format';
import { PERMISSIONS } from '@/lib/permissions';
import { ArrowLeft, FileText, Loader2, Send, XCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function POViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: po, isLoading, isError } = useGetPO(id);
    
    const releaseMutation = useReleasePO();

    const handleRelease = () => {
        if (!po) return;
        releaseMutation.mutate(po.id, {
            onSuccess: () => {
                toast({ title: 'Sukses', description: 'PO berhasil di-release.' });
            },
            onError: (error) => {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        });
    }
    
    const handlePrint = () => {
        // Mock printing by opening a blank tab
        const pdfWindow = window.open("", "_blank");
        pdfWindow?.document.write(`<p>Mencetak PO ${po?.docNo}...</p>`);
    }

    if (isLoading) {
        return <div className="space-y-4"><Skeleton className="h-96 w-full" /></div>;
    }

    if (isError || !po) {
        return <p>Gagal memuat PO atau PO tidak ditemukan.</p>;
    }

    return (
        <div className="space-y-6">
            <Link to="/purchasing/po" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar PO
            </Link>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Detail PO: {po.docNo}</h1>
                    <Badge variant={po.status === DocStatus.RELEASED ? 'default' : 'secondary'}>{po.status}</Badge>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={handlePrint}>
                        <FileText className="mr-2 h-4 w-4"/>
                        Cetak
                    </Button>
                    <Guard can={PERMISSIONS.PO_CANCEL}>
                         <Button variant="outline" className="text-destructive hover:text-destructive">
                            <XCircle className="mr-2 h-4 w-4"/>
                            Batalkan
                        </Button>
                    </Guard>
                    <Guard can={PERMISSIONS.PO_RELEASE}>
                         <Button onClick={handleRelease} disabled={releaseMutation.isPending || po.status !== DocStatus.APPROVED}>
                            {releaseMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                            Release PO
                        </Button>
                    </Guard>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Umum</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">Vendor:</span> {po.vendor?.name}</div>
                    <div><span className="font-semibold text-muted-foreground">Tanggal PO:</span> {formatDate(po.docDate!)}</div>
                    <div><span className="font-semibold text-muted-foreground">Tipe PO:</span> {po.poType}</div>
                    <div><span className="font-semibold text-muted-foreground">Syarat Pembayaran:</span> {po.paymentTerms}</div>
                    <div className="col-span-2"><span className="font-semibold text-muted-foreground">Alamat Pengiriman:</span> {po.deliveryAddress}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-right">Kuantitas</TableHead>
                                <TableHead className="text-right">Harga</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {po.lines.map(line => (
                                <TableRow key={line.id}>
                                    <TableCell>{line.item?.name}</TableCell>
                                    <TableCell>{line.description}</TableCell>
                                    <TableCell className="text-right">{line.quantity} {line.uom?.name}</TableCell>
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
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span> <span>{formatCurrency(po.subtotal)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pajak:</span> <span>{formatCurrency(po.taxAmount)}</span></div>
                        <div className="flex justify-between font-bold text-lg"><span >Grand Total:</span> <span>{formatCurrency(po.grandTotal)}</span></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
