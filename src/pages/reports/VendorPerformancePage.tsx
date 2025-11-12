import React, { useMemo } from 'react';
import { useGetVendorPerformance } from '@/api/hooks/useReports';
import { DataTable } from '@/components/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { VendorPerformanceData } from '@/api/types/reports';
import { createBasicColumn } from '@/components/DataTable/columns';
import { Users, ArrowLeft, Star, ThumbsUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const PerformanceCell = ({ value, unit = "%" }: { value: number, unit?: string }) => {
    const color = value >= 95 ? 'text-green-600' : value >= 85 ? 'text-yellow-600' : 'text-red-600';
    return <div className={cn("font-semibold", color)}>{value.toFixed(1)}{unit}</div>
}


export default function VendorPerformancePage() {
    const { data, isLoading } = useGetVendorPerformance();

    const columns = useMemo<ColumnDef<VendorPerformanceData>[]>(() => [
        createBasicColumn('vendorName', 'Vendor'),
        {
            accessorKey: 'onTimeDeliveryRate',
            header: 'Ketepatan Waktu (OTD)',
            cell: ({ row }) => <PerformanceCell value={row.original.onTimeDeliveryRate} />
        },
        {
            accessorKey: 'qualityScore',
            header: 'Skor Kualitas',
            cell: ({ row }) => <PerformanceCell value={row.original.qualityScore} unit="/100" />
        },
        {
            accessorKey: 'avgPriceCompetitiveness',
            header: 'Kompetisi Harga',
            cell: ({ row }) => <PerformanceCell value={row.original.avgPriceCompetitiveness} />
        },
        {
            accessorKey: 'totalPOs',
            header: 'Total PO',
            cell: ({ row }) => <div className="text-center">{row.original.totalPOs}</div>
        },
    ], []);

    return (
        <div className="space-y-6">
            <Link to="/reports" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Pusat Laporan
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Laporan Kinerja Vendor
            </h1>

            <DataTable
                columns={columns}
                data={data ?? []}
                isLoading={isLoading}
                pageCount={1}
                total={data?.length ?? 0}
                queryState={{ pageIndex: 0, pageSize: data?.length ?? 10, sorting: [{id: 'onTimeDeliveryRate', desc: true}], filters: [] }}
                setQueryState={() => {}}
            />
        </div>
    );
}
