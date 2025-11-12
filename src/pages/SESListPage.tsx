import { Guard } from "@/app/guards/Guard";
import { PERMISSIONS } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { useGetSESs } from "@/api/hooks/useSES";
import { useState, useMemo } from "react";
import {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { ServiceEntry } from "@/api/types/purchasing";
import { DataTable } from "@/components/DataTable/DataTable";
import {
  createActionsColumn,
  createBasicColumn,
  createDateColumn,
  createStatusBadgeColumn,
  createCurrencyColumn,
} from "@/components/DataTable/columns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const SESListPage = () => {
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

  const { data, isLoading } = useGetSESs({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
  });

  const columns = useMemo<ColumnDef<ServiceEntry>[]>(() => [
    createBasicColumn("docNo", "No. SES"),
    createDateColumn("docDate", "Tanggal"),
    { accessorKey: "po.docNo", header: "No. PO" },
    createCurrencyColumn("totalAmount", "Total Nilai"),
    createStatusBadgeColumn("status", "Status"),
    createActionsColumn<ServiceEntry>([
        { label: "Lihat Detail", onClick: (ses) => alert(`Lihat ${ses.docNo}`) },
    ]),
  ], []);

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
     <Guard can={PERMISSIONS.SES_CREATE}>
        <Button size="sm" onClick={() => navigate('/services/ses/new')}>
            <Plus className="mr-2 h-4 w-4" /> Buat SES Baru
        </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Entry Sheets (SES)</h1>
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