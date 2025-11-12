import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Clock, BookOpen, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const reports = [
    {
        title: "Analisis Pengeluaran (Spend Analysis)",
        description: "Lihat ringkasan pengeluaran berdasarkan kategori, cost center, atau periode waktu.",
        link: "/reports/spend-analysis",
        icon: BarChart2,
    },
    {
        title: "Laporan Umur Utang (AP Aging)",
        description: "Lacak faktur yang belum dibayar dan jatuh tempo berdasarkan kategori umur.",
        link: "/reports/ap-aging",
        icon: Clock,
    },
    {
        title: "Laporan Open Purchase Order",
        description: "Daftar semua PO yang masih memiliki item yang belum diterima sepenuhnya.",
        link: "/reports/open-pos",
        icon: BookOpen,
    },
    {
        title: "Laporan Kinerja Vendor",
        description: "Analisis kinerja vendor berdasarkan ketepatan waktu pengiriman, kualitas, dan harga.",
        link: "/reports/vendor-performance",
        icon: Users,
    }
];

export const ReportsPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Pusat Laporan</h1>
            <p className="text-muted-foreground">Pilih laporan yang ingin Anda lihat dari daftar di bawah ini.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                    <Link to={report.link} key={report.title} className="block hover:shadow-lg transition-shadow rounded-lg">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <report.icon className="h-8 w-8 text-primary" />
                                <div>
                                    <CardTitle>{report.title}</CardTitle>
                                    <CardDescription>{report.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end justify-end">
                                <span className="text-sm font-medium text-primary flex items-center">
                                    Lihat Laporan <ArrowRight className="ml-2 h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};
