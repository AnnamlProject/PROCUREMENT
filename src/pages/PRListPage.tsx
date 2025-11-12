
import { Guard } from "@/app/guards/Guard";
import { Plus } from "lucide-react";

export const PRListPage = () => {
    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Purchase Requisitions (PR)</h1>
                <Guard can="pr.create">
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                       <Plus className="mr-2 h-4 w-4" /> Buat PR Baru
                    </button>
                </Guard>
            </div>
            <p className="mt-2 text-muted-foreground">Kelola semua permintaan pembelian di sini.</p>
            <div className="mt-6 border rounded-lg p-8 text-center">
                 <p className="text-muted-foreground">Tabel data PR akan ditampilkan di sini.</p>
            </div>
        </div>
    );
};
