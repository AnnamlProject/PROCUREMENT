import React, { useState, useMemo } from 'react';
import { useGetSpendAnalysis } from '@/api/hooks/useReports';
import { useLookups } from '@/api/hooks/useLookups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { BarChart2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const SimpleBarChart = ({ data }: { data: { label: string; value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengeluaran Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="flex h-64 items-end gap-4 border-l border-b p-4 bg-gray-50 rounded-md">
                    {data.map(item => (
                        <div key={item.label} className="flex flex-col items-center gap-2 flex-1 group">
                             <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatCurrency(item.value)}
                            </div>
                            <div
                                className="w-full bg-primary hover:bg-primary/80 transition-colors"
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                                title={`${item.label}: ${formatCurrency(item.value)}`}
                            />
                            <span className="text-sm font-medium">{item.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default function SpendAnalysisPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    
    const { data, isLoading } = useGetSpendAnalysis({ year });

    const chartData = useMemo(() => {
        const monthlyTotals: { [key: number]: number } = {};
        MONTHS.forEach((_, i) => monthlyTotals[i + 1] = 0);

        data?.forEach(category => {
            category.byMonth.forEach(monthData => {
                monthlyTotals[monthData.month] += monthData.totalAmount;
            });
        });

        return MONTHS.map((monthName, i) => ({
            label: monthName,
            value: monthlyTotals[i + 1]
        }));
    }, [data]);


    return (
        <div className="space-y-6">
            <Link to="/reports" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Pusat Laporan
            </Link>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart2 className="h-6 w-6" />
                    Analisis Pengeluaran (Spend Analysis)
                </h1>
                <div className="w-32">
                     <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : (
                <>
                    <SimpleBarChart data={chartData} />
                    <Card>
                        <CardHeader><CardTitle>Ringkasan per Kategori (Cost Center)</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Total Pengeluaran</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.map(item => (
                                        <TableRow key={item.category}>
                                            <TableCell className="font-medium">{item.category}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-muted">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right">{formatCurrency(data?.reduce((acc, item) => acc + item.totalAmount, 0) ?? 0)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
