import React, { useMemo } from 'react';
import { useGetOpenPOs } from '@/api/hooks/useReports';
import { DataTable } from '@/components/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { OpenPOData } from '@/api/types/reports';
import { createBasicColumn, createDateColumn } from '@/components/DataTable/columns';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function OpenPOPage() {
    const { data, isLoading } = useGetOpenPOs();

    const columns = useMemo<ColumnDef<OpenPOData>[]>(() => [
        {
            accessorKey: 'poDocNo',
            header: 'No. PO',
            cell: ({ row }) => <Link to={`/purchasing/po/view/${row.original.poId}`} className="text-primary hover:underline">{row.original.poDocNo}</Link>
        },
        createDateColumn('poDate', 'Tgl. PO'),
        createBasicColumn('vendorName', 'Vendor'),
        createBasicColumn('itemName', 'Item'),
        {
            accessorKey: 'orderedQty',
            header: 'Dipesan',
            cell: ({ row }) => <div className="text-right">{row.original.orderedQty}</div>
        },
        {
            accessorKey: 'receivedQty',
            header: 'Diterima',
            cell: ({ row }) => <div className="text-right">{row.original.receivedQty}</div>
        },
        {
            accessorKey: 'remainingQty',
            header: 'Sisa',
            cell: ({ row }) => <div className="text-right font-bold">{row.original.remainingQty}</div>
        },
        {
            accessorKey: 'progress',
            header: 'Progres',
            cell: ({ row }) => {
                 const progress = (row.original.receivedQty / row.original.orderedQty) * 100;
                 return <Progress value={progress} className="w-full" />
            }
        },
        createDateColumn('eta', 'ETA'),
    ], []);

    return (
        <div className="space-y-6">
            <Link to="/reports" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Pusat Laporan
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Laporan Open Purchase Order
            </h1>

            <DataTable
                columns={columns}
                data={data ?? []}
                isLoading={isLoading}
                pageCount={1}
                total={data?.length ?? 0}
                queryState={{ pageIndex: 0, pageSize: data?.length ?? 10, sorting: [{id: 'poDate', desc: true}], filters: [] }}
                setQueryState={() => {}}
            />
        </div>
    );
}
