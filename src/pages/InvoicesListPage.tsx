import { Guard } from "@/app/guards/Guard";
import { PERMISSIONS } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { useGetInvoices, useApproveInvoice } from "@/api/hooks/useInvoice";
import { useState, useMemo } from "react";
import {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { Invoice } from "@/api/types/purchasing";
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
import { useToast } from "@/components/ui/use-toast";

export const InvoicesListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const { data, isLoading } = useGetInvoices({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
  });

  const approveMutation = useApproveInvoice();

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
        onSuccess: () => {
            toast({ title: 'Sukses', description: 'Faktur berhasil disetujui.' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  const columns = useMemo<ColumnDef<Invoice>[]>(() => [
    createBasicColumn("vendorInvoiceNo", "No. Faktur Vendor"),
    createDateColumn("docDate", "Tanggal Faktur"),
    { accessorKey: "vendor.name", header: "Vendor" },
    { accessorKey: "po.docNo", header: "No. PO" },
    createStatusBadgeColumn("status", "Status"),
    createCurrencyColumn("grandTotal", "Total"),
    createActionsColumn<Invoice>([
        { label: "Lihat Detail", onClick: (invoice) => navigate(`/invoices/view/${invoice.id}`) },
        { 
            label: "Setujui", 
            onClick: (invoice) => handleApprove(invoice.id),
            isHidden: (invoice) => invoice.status !== DocStatus.SUBMITTED,
            guard: PERMISSIONS.INVOICE_APPROVE 
        },
    ]),
  ], [navigate]);

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
     <Guard can={PERMISSIONS.INVOICE_CREATE}>
        <Button size="sm" onClick={() => navigate('/invoices/new')}>
            <Plus className="mr-2 h-4 w-4" /> Buat Faktur Baru
        </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Faktur Pembelian</h1>
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
              { value: 'vendorInvoiceNo', label: 'No. Faktur'},
              { value: 'status', label: 'Status', options: Object.values(DocStatus).map(s => ({value: s, label: s}))}
            ]}
        />
    </div>
  );
};
