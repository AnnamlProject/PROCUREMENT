
import { useGetRFQs } from "@/api/hooks/useRFQ";
import { RFQ } from "@/api/types/purchasing";
import { DataTable } from "@/components/DataTable/DataTable";
import {
  createActionsColumn,
  createBasicColumn,
  createDateColumn,
  createStatusBadgeColumn,
} from "@/components/DataTable/columns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/permissions";
import { Guard } from "@/app/guards/Guard";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export const RFQListPage = () => {
  const navigate = useNavigate();
  const [queryState, setQueryState] = useState({
    pageIndex: 0,
    pageSize: 10,
    sorting: [{ id: "docDate", desc: true }],
    filters: [],
  });

  const { data, isLoading } = useGetRFQs({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
  });

  const columns = useMemo<ColumnDef<RFQ>[]>(
    () => [
      createBasicColumn("docNo", "No. RFQ"),
      createDateColumn("docDate", "Tanggal"),
      createStatusBadgeColumn("status", "Status"),
      {
        accessorKey: "invitedVendors",
        header: "Vendor Diundang",
        cell: ({ row }) => {
          const vendors = row.original.invitedVendors ?? [];
          return (
            <div className="flex flex-wrap gap-1">
              {vendors.map((vendor) => (
                <Badge key={vendor.id} variant="secondary">
                  {vendor.name}
                </Badge>
              ))}
            </div>
          );
        },
      },
      createDateColumn("deadline", "Batas Waktu"),
      createActionsColumn<RFQ>([
        {
          label: "Lihat Tabulasi Penawaran",
          onClick: (rfq) => navigate(`/purchasing/rfq/${rfq.id}/bid-tabulation`),
        },
      ]),
    ],
    [navigate]
  );

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
    <Guard can={PERMISSIONS.RFQ_CREATE}>
      <Button size="sm" onClick={() => navigate("/purchasing/rfq/new")}>
        <Plus className="mr-2 h-4 w-4" /> Buat RFQ Baru
      </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Request for Quotations (RFQ)</h1>
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
