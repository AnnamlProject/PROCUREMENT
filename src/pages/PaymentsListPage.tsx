import { Guard } from "@/app/guards/Guard";
import { PERMISSIONS } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { useGetPayments } from "@/api/hooks/usePayment";
import { useState, useMemo } from "react";
import {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { Payment } from "@/api/types/purchasing";
import { DataTable } from "@/components/DataTable/DataTable";
import {
  createActionsColumn,
  createBasicColumn,
  createCurrencyColumn,
  createDateColumn,
  createStatusBadgeColumn,
} from "@/components/DataTable/columns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const PaymentsListPage = () => {
  const navigate = useNavigate();
  const [queryState, setQueryState] = useState<{
    pageIndex: number;
    pageSize: number;
    sorting: SortingState;
    filters: ColumnFiltersState;
  }>({
    pageIndex: 0,
    pageSize: 10,
    sorting: [{ id: "docDate", desc: true }],
    filters: [],
  });

  const { data, isLoading } = useGetPayments({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
  });

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    createBasicColumn("docNo", "No. Pembayaran"),
    createDateColumn("docDate", "Tanggal Bayar"),
    createBasicColumn("paymentMethod", "Metode"),
    createStatusBadgeColumn("status", "Status"),
    createCurrencyColumn("totalPaid", "Total Dibayar"),
    createActionsColumn<Payment>([
        { label: "Lihat Detail", onClick: (p) => alert(`Lihat ${p.docNo}`) },
    ]),
  ], []);

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
     <Guard can={PERMISSIONS.PAYMENT_CREATE}>
        <Button size="sm" onClick={() => navigate('/payments/new-run')}>
            <Plus className="mr-2 h-4 w-4" /> Buat Pembayaran Baru
        </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pembayaran</h1>
      </div>
       <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            pageCount={pageCount}
            total={total}
            queryState={queryState}
            setQueryState={setQueryState}
            toolbarActions={toolbarActions}
        />
    </div>
  );
};
