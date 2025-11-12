import React, { useMemo } from 'react';
import { useGetAPAging } from '@/api/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { APAgingData } from '@/api/types/reports';
import { createBasicColumn, createCurrencyColumn, createDateColumn } from '@/components/DataTable/columns';
import { Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

export default function APAgingPage() {
    const { data, isLoading } = useGetAPAging();

    const columns = useMemo<ColumnDef<APAgingData>[]>(() => [
        createBasicColumn('vendorName', 'Vendor'),
        createBasicColumn('invoiceNo', 'No. Faktur'),
        createDateColumn('dueDate', 'Jatuh Tempo'),
        {
            accessorKey: 'daysOverdue',
            header: 'Telat (Hari)',
            cell: ({ row }) => <div className="text-center">{row.original.daysOverdue}</div>
        },
        createCurrencyColumn('amount', 'Nilai'),
        {
            accessorKey: 'bucket',
            header: 'Kategori Umur',
            cell: ({ row }) => <Badge variant={row.original.bucket === '>90' ? 'destructive' : 'secondary'}>{row.original.bucket}</Badge>
        }
    ], []);
    
    const summary = useMemo(() => {
        if (!data) return { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0, total: 0 };
        const result = data.reduce((acc, item) => {
            acc[item.bucket] = (acc[item.bucket] || 0) + item.amount;
            acc.total += item.amount;
            return acc;
        }, { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0, total: 0 });
        return result;
    }, [data]);

    return (
        <div className="space-y-6">
            <Link to="/reports" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Pusat Laporan
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Laporan Umur Utang (AP Aging)
            </h1>

            {isLoading ? <Skeleton className="h-48 w-full" /> : (
                 <div className="grid grid-cols-5 gap-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Utang</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.total)}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">0-30 Hari</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary['0-30'])}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">31-60 Hari</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary['31-60'])}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">61-90 Hari</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary['61-90'])}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-destructive">>90 Hari</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(summary['>90'])}</div></CardContent></Card>
                 </div>
            )}

            <DataTable
                columns={columns}
                data={data ?? []}
                isLoading={isLoading}
                pageCount={1}
                total={data?.length ?? 0}
                queryState={{ pageIndex: 0, pageSize: data?.length ?? 10, sorting: [{id: 'daysOverdue', desc: true}], filters: [] }}
                setQueryState={() => {}} // Not needed for this report
            />
        </div>
    );
}
