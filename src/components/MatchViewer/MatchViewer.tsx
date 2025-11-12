import { GoodsReceipt, Invoice, PO, ServiceEntry } from "@/api/types/purchasing"
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { checkTolerance } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, Minus, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface MatchViewerProps {
    po: PO;
    receipts?: GoodsReceipt[];
    services?: ServiceEntry[];
    invoice?: Invoice;
}

const DeltaIndicator = ({ delta, isPrice = false }: { delta: number, isPrice?: boolean }) => {
    if (delta === 0) {
        return <span className="flex items-center text-green-600"><CheckCircle className="mr-1 h-4 w-4" /> Cocok</span>;
    }
    const Icon = delta > 0 ? ArrowUp : ArrowDown;
    const color = delta > 0 ? "text-red-600" : "text-yellow-600";
    return (
        <span className={cn("flex items-center font-semibold", color)}>
            <Icon className="mr-1 h-4 w-4" />
            {isPrice ? formatCurrency(delta) : delta.toLocaleString()}
        </span>
    );
};

export const MatchViewer = ({ po, receipts = [], invoice }: MatchViewerProps) => {
    const { toast } = useToast();

    const matchData = useMemo(() => {
        const lineItems = po.lines.map(poLine => {
            const relatedReceipts = receipts.flatMap(r => r.lines).filter(rl => rl.poLineId === poLine.id);
            const totalReceivedQty = relatedReceipts.reduce((sum, rl) => sum + rl.receivedQty, 0);
            
            const invoiceLine = invoice?.lines.find(il => il.poLineId === poLine.id);

            const qtyCheck = checkTolerance(poLine.quantity, totalReceivedQty, po.tolerance ?? 0);
            const invoicedQtyCheck = checkTolerance(totalReceivedQty, invoiceLine?.quantity ?? 0, 0); // Must be exact
            const priceCheck = checkTolerance(poLine.price, invoiceLine?.price ?? 0, po.tolerance ?? 0);

            return {
                poLine,
                totalReceivedQty,
                invoiceLine,
                qtyCheck,
                invoicedQtyCheck,
                priceCheck
            };
        });

        const overallStatus = {
            qty: lineItems.every(l => l.qtyCheck.isWithin),
            price: lineItems.every(l => l.priceCheck.isWithin),
            invoiceQty: lineItems.every(l => l.invoicedQtyCheck.isWithin),
        };

        const isFullyMatched = overallStatus.qty && overallStatus.price && overallStatus.invoiceQty;

        return { lineItems, isFullyMatched };
    }, [po, receipts, invoice]);


    const handleRaiseException = () => {
        toast({
            title: "Fitur Dalam Pengembangan",
            description: "Proses pembuatan pengecualian akan diimplementasikan di sini.",
            variant: "default",
        });
    };

    return (
        <div className="space-y-4 mt-4">
            <Alert variant={matchData.isFullyMatched ? "success" : "warning"}>
                 {matchData.isFullyMatched ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{matchData.isFullyMatched ? "Dokumen Cocok" : "Ditemukan Varian"}</AlertTitle>
                <AlertDescription>
                    {matchData.isFullyMatched 
                        ? "Semua kuantitas dan harga pada PO, GRN, dan Invoice cocok atau dalam batas toleransi."
                        : "Terdapat perbedaan kuantitas atau harga. Periksa detail di bawah."
                    }
                </AlertDescription>
            </Alert>
             <Card>
                <CardHeader>
                    <CardTitle>Perbandingan Detail Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">PO Qty</TableHead>
                                <TableHead className="text-center">Diterima</TableHead>
                                <TableHead className="text-center">Ditagih</TableHead>
                                <TableHead className="text-right">PO Harga</TableHead>
                                <TableHead className="text-right">Harga Tagihan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matchData.lineItems.map(({ poLine, totalReceivedQty, invoiceLine, qtyCheck, invoicedQtyCheck, priceCheck }) => (
                                <TableRow key={poLine.id}>
                                    <TableCell className="font-medium">{poLine.item?.name}</TableCell>
                                    <TableCell className="text-center">{poLine.quantity}</TableCell>
                                    <TableCell className={cn("text-center font-semibold", !qtyCheck.isWithin && "text-red-600")}>
                                        {totalReceivedQty}
                                    </TableCell>
                                    <TableCell className={cn("text-center font-semibold", !invoicedQtyCheck.isWithin && "text-red-600")}>
                                        {invoiceLine?.quantity ?? <Minus className="mx-auto h-4 w-4 text-muted-foreground"/>}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(poLine.price)}</TableCell>
                                    <TableCell className={cn("text-right font-semibold", !priceCheck.isWithin && "text-red-600")}>
                                        {invoiceLine ? formatCurrency(invoiceLine.price) : <Minus className="ml-auto h-4 w-4 text-muted-foreground"/>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <SummaryCard title="Purchase Order" total={po.grandTotal} />
                 <SummaryCard title="Total Diterima" total={0} note="Perhitungan nilai total GRN memerlukan data harga" />
                 <SummaryCard title="Invoice" total={invoice?.grandTotal} poTotal={po.grandTotal} />
            </div>
            {!matchData.isFullyMatched && (
                <div className="text-right">
                    <Button variant="destructive" onClick={handleRaiseException}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Buat Pengecualian (Raise Exception)
                    </Button>
                </div>
            )}
        </div>
    );
};

interface SummaryCardProps {
    title: string;
    total?: number;
    poTotal?: number;
    note?: string;
}
const SummaryCard = ({ title, total, poTotal, note }: SummaryCardProps) => (
    <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
            {typeof total === 'number' ? (
                <>
                    <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                    {typeof poTotal === 'number' && total !== poTotal && (
                        <DeltaIndicator delta={total - poTotal} isPrice />
                    )}
                </>
            ) : <p className="text-muted-foreground italic text-sm">{note || 'Tidak ada data'}</p>}
        </CardContent>
    </Card>
);
