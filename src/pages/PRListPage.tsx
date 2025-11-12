
import { Guard } from "@/app/guards/Guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AlertTriangle, CheckCircle, MoreHorizontal, Plus } from "lucide-react";
import { useGetPRs, useSubmitPR } from "@/api/hooks/usePR";
import { useState, useMemo } from "react";
import {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { PR } from "@/api/types/purchasing";
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

export const PRListPage = () => {
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

  const { data, isLoading } = useGetPRs({
    page: queryState.pageIndex + 1,
    perPage: queryState.pageSize,
    sortBy: queryState.sorting[0]?.id,
    sortDir: queryState.sorting[0]?.desc ? "desc" : "asc",
    status: queryState.filters.find(f => f.id === 'status')?.value,
    docNo: queryState.filters.find(f => f.id === 'docNo')?.value,
  });

  const submitPRMutation = useSubmitPR();

  const handleSubmit = (id: string) => {
    submitPRMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Sukses",
          description: "PR berhasil di-submit.",
          variant: "default",
        });
      },
      onError: (error) => {
         toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }

  const columns = useMemo<ColumnDef<PR>[]>(() => [
    createBasicColumn("docNo", "No. PR"),
    createDateColumn("docDate", "Tanggal"),
    createBasicColumn("requesterName", "Requester"),
    createBasicColumn("costCenter.name", "Cost Center"),
    createStatusBadgeColumn("status", "Status"),
    createCurrencyColumn("totalAmount", "Total"),
    createActionsColumn<PR>([
        { label: "Lihat Detail", onClick: (pr) => navigate(`/purchasing/pr/edit/${pr.id}`) },
        { 
          label: "Ubah", 
          onClick: (pr) => navigate(`/purchasing/pr/edit/${pr.id}`), 
          isHidden: pr => pr.status !== DocStatus.DRAFT,
          guard: PERMISSIONS.PR_UPDATE,
        },
        { 
          label: "Submit", 
          onClick: (pr) => handleSubmit(pr.id), 
          isHidden: pr => pr.status !== DocStatus.DRAFT,
          guard: PERMISSIONS.PR_SUBMIT,
        },
        {
          label: "Approve",
          onClick: (pr) => alert(`Approve ${pr.docNo}`),
          isHidden: pr => pr.status !== DocStatus.SUBMITTED,
          guard: PERMISSIONS.PR_APPROVE
        }
    ]),
  ], [navigate]);

  const pageCount = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const toolbarActions = (
     <Guard can={PERMISSIONS.PR_CREATE}>
        <Button size="sm" onClick={() => navigate('/purchasing/pr/new')}>
            <Plus className="mr-2 h-4 w-4" /> Buat PR Baru
        </Button>
    </Guard>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Requisitions (PR)</h1>
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
