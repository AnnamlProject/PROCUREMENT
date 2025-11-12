import { Guard } from "@/app/guards/Guard";
import { PERMISSIONS } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { useGetGRNs } from "@/api/hooks/useGRN";
import { useState, useMemo } from "react";
import {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { GoodsReceipt } from "@/api/types/purchasing";
import { DataTable } from "@/components/DataTable/DataTable";
import {
  createActionsColumn,
  createBasicColumn,
  createDateColumn,
  createStatusBadgeColumn,
} from "@/components/DataTable/columns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const GRNListPage = () => {
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

  const { data, isLoading } = useGetGRNs({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
  });

  const columns = useMemo<ColumnDef<GoodsReceipt>[]>(() => [
    createBasicColumn("docNo", "No. GRN"),
    createDateColumn("docDate", "Tanggal"),
    { accessorKey: "po.docNo", header: "No. PO" },
    createBasicColumn("deliveryOrderNo", "No. Surat Jalan"),
    createStatusBadgeColumn("status", "Status"),
    createActionsColumn<GoodsReceipt>([
        { label: "Lihat Detail", onClick: (grn) => alert(`Lihat ${grn.docNo}`) },
    ]),
  ], []);

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
     <Guard can={PERMISSIONS.GRN_CREATE}>
        <Button size="sm" onClick={() => navigate('/receiving/grn/new')}>
            <Plus className="mr-2 h-4 w-4" /> Buat GRN Baru
        </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goods Receipt Notes (GRN)</h1>
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
