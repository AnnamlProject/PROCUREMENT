
import { useGetRFQWithBids, useAwardRFQ } from '@/api/hooks/useRFQ';
import { Award, RFQBid, Vendor } from '@/api/types/purchasing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { AwardIcon, ArrowLeft, Loader2, Save } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type AwardSelection = Record<string, string>; // { rfqLineId: vendorId }

export default function BidTabulationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data, isLoading } = useGetRFQWithBids(id);
    
    const [weights, setWeights] = useState({ price: 60, leadTime: 20, quality: 20 });
    const [awards, setAwards] = useState<AwardSelection>({});
    
    const awardMutation = useAwardRFQ();

    const { rfq, bids, vendors } = useMemo(() => {
        if (!data) return { rfq: null, bids: [], vendors: [] };
        const vendorsMap = new Map<string, Vendor>();
        data.bids.forEach(bid => {
            const vendor = data.rfq.invitedVendors?.find(v => v.id === bid.vendorId);
            if (vendor && !vendorsMap.has(vendor.id)) {
                vendorsMap.set(vendor.id, vendor);
            }
        });
        return { rfq: data.rfq, bids: data.bids, vendors: Array.from(vendorsMap.values()) };
    }, [data]);

    const scores = useMemo(() => {
        if (!rfq || bids.length === 0) return {};
        
        const lineScores: Record<string, any[]> = {};

        rfq.lines.forEach(line => {
            const lineBids = bids.filter(b => b.rfqLineId === line.id);
            if (lineBids.length === 0) return;

            const minPrice = Math.min(...lineBids.map(b => b.price));
            const minLeadTime = Math.min(...lineBids.map(b => b.leadTimeDays));

            const calculatedScores = lineBids.map(bid => {
                const vendor = vendors.find(v => v.id === bid.vendorId);
                const quality = vendor?.qualityScore ?? 70; // Default quality score

                const priceScore = minPrice > 0 ? (minPrice / bid.price) * weights.price : 0;
                const leadTimeScore = minLeadTime > 0 ? (minLeadTime / bid.leadTimeDays) * weights.leadTime : 0;
                const qualityScore = (quality / 100) * weights.quality;
                
                const totalScore = priceScore + leadTimeScore + qualityScore;

                return { vendorId: bid.vendorId, priceScore, leadTimeScore, qualityScore, totalScore };
            });

            lineScores[line.id] = calculatedScores;
        });
        return lineScores;

    }, [rfq, bids, vendors, weights]);

    const handleSelectWinner = (lineId: string, vendorId: string) => {
        setAwards(prev => ({ ...prev, [lineId]: vendorId }));
    };

    const handleSaveAwards = () => {
        if (!rfq) return;

        const awardData: Award[] = Object.entries(awards).map(([rfqLineId, vendorId]) => ({
            rfqLineId,
            vendorId,
            awardedQty: rfq.lines.find(l => l.id === rfqLineId)?.quantity ?? 0
        }));

        awardMutation.mutate({ id: rfq.id, awards: awardData }, {
            onSuccess: (res) => {
                toast({ title: "Sukses", description: res.message });
                navigate('/purchasing/rfq');
            },
            onError: (err) => {
                 toast({ title: "Error", description: err.message, variant: 'destructive' });
            }
        });
    }

    const allLinesAwarded = rfq ? rfq.lines.length === Object.keys(awards).length : false;


    if (isLoading) {
        return <div className="space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-96 w-full" /></div>;
    }

    if (!rfq) {
        return <p>RFQ tidak ditemukan.</p>;
    }

    return (
        <div className="space-y-6">
            <Link to="/purchasing/rfq" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar RFQ
            </Link>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tabulasi Penawaran: {rfq.docNo}</h1>
                 <Button onClick={handleSaveAwards} disabled={!allLinesAwarded || awardMutation.isPending}>
                    {awardMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Award & Buat PO
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Bobot Penilaian</CardTitle>
                    <CardDescription>Sesuaikan bobot untuk menghitung skor vendor secara dinamis.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Harga ({weights.price}%)</Label>
                        <Slider value={[weights.price]} onValueChange={([v]) => setWeights(w => ({...w, price: v}))} max={100} step={5} />
                    </div>
                     <div className="space-y-2">
                        <Label>Waktu Pengiriman ({weights.leadTime}%)</Label>
                        <Slider value={[weights.leadTime]} onValueChange={([v]) => setWeights(w => ({...w, leadTime: v}))} max={100} step={5} />
                    </div>
                     <div className="space-y-2">
                        <Label>Kualitas ({weights.quality}%)</Label>
                        <Slider value={[weights.quality]} onValueChange={([v]) => setWeights(w => ({...w, quality: v}))} max={100} step={5} />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {rfq.lines.map(line => {
                    const lineBids = bids.filter(b => b.rfqLineId === line.id);
                    const lineScoresData = scores[line.id] ?? [];
                    const bestScore = Math.max(...lineScoresData.map(s => s.totalScore));
                    
                    return (
                        <Card key={line.id}>
                            <CardHeader>
                                <CardTitle>{line.item.name}</CardTitle>
                                <CardDescription>{line.quantity} {line.uom.name} - {line.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead className="text-right">Harga Penawaran</TableHead>
                                            <TableHead className="text-right">Waktu (Hari)</TableHead>
                                            <TableHead className="text-right">Skor Kualitas</TableHead>
                                            <TableHead className="text-right">Total Skor</TableHead>
                                            <TableHead className="text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lineBids.length > 0 ? lineBids.map(bid => {
                                            const vendor = vendors.find(v => v.id === bid.vendorId);
                                            const score = lineScoresData.find(s => s.vendorId === bid.vendorId);
                                            const isRecommended = score?.totalScore === bestScore;
                                            const isSelected = awards[line.id] === bid.vendorId;
                                            return (
                                                <TableRow key={bid.id} className={isSelected ? 'bg-green-100' : ''}>
                                                    <TableCell className="font-medium">
                                                        {vendor?.name}
                                                        {isRecommended && <Badge className="ml-2">Rekomendasi</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(bid.price)}</TableCell>
                                                    <TableCell className="text-right">{bid.leadTimeDays}</TableCell>
                                                    <TableCell className="text-right">{vendor?.qualityScore ?? 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-bold">{score?.totalScore.toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">
                                                        {isSelected ? (
                                                            <div className="flex items-center justify-center text-green-600 font-semibold">
                                                                <AwardIcon className="mr-2 h-4 w-4" /> Pemenang
                                                            </div>
                                                        ) : (
                                                            <Button size="sm" onClick={() => handleSelectWinner(line.id, bid.vendorId)}>
                                                                Pilih Pemenang
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center">Belum ada penawaran untuk item ini.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
