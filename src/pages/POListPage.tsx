
import { Guard } from "@/app/guards/Guard";
import { PERMISSIONS } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { useGetPOs } from "@/api/hooks/usePO";
import { useState, useMemo } from "react";
import {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { PO } from "@/api/types/purchasing";
import { DocStatus } from "@/api/types/core";
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

export const POListPage = () => {
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

  const { data, isLoading } = useGetPOs({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
  });

  const columns = useMemo<ColumnDef<PO>[]>(() => [
    createBasicColumn("docNo", "No. PO"),
    createDateColumn("docDate", "Tanggal"),
    { accessorKey: "vendor.name", header: "Vendor" },
    createBasicColumn("poType", "Tipe"),
    createStatusBadgeColumn("status", "Status"),
    createCurrencyColumn("grandTotal", "Total"),
    createActionsColumn<PO>([
        { label: "Lihat Detail", onClick: (po) => navigate(`/purchasing/po/view/${po.id}`) },
    ]),
  ], [navigate]);

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
     <Guard can={PERMISSIONS.PO_CREATE}>
        <Button size="sm" onClick={() => navigate('/purchasing/po/new')}>
            <Plus className="mr-2 h-4 w-4" /> Buat PO Baru
        </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Orders (PO)</h1>
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
            filterFields={[
              { value: 'docNo', label: 'No. Dokumen'},
              { value: 'status', label: 'Status', options: Object.values(DocStatus).map(s => ({value: s, label: s}))}
            ]}
        />
    </div>
  );
};
