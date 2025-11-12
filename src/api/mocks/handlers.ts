import { http, HttpResponse, delay } from 'msw';
import * as db from './db';
import { DocStatus } from '../types/core';
import { GoodsReceipt, Invoice, PO, PR, RFQ, ServiceEntry, Payment, PaymentLine } from '../types/purchasing';
import { differenceInDays } from 'date-fns';
import { AgingBucket, APAgingData, OpenPOData, SpendAnalysisData, VendorPerformanceData } from '../types/reports';

const API_BASE_URL = '/api';

// Simple in-memory store for idempotency keys
const idempotencyStore = new Map<string, { status: number; body: any }>();

const withIdempotency = async (request: Request, handler: () => Promise<HttpResponse>) => {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    
    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
        const stored = idempotencyStore.get(idempotencyKey)!;
        // Return a 409 Conflict with the original response body
        return HttpResponse.json(stored.body, { status: 409, headers: { 'Content-Location': stored.body.id } });
    }

    const response = await handler();
    
    if (idempotencyKey && response.status >= 200 && response.status < 300) {
        const body = await response.json();
        idempotencyStore.set(idempotencyKey, { status: response.status, body });
        // The body has been consumed, so we need to create a new response
        return HttpResponse.json(body, { status: response.status });
    }
    
    return response;
};


export const handlers = [
  // --- Lookups Handler ---
  http.get(`${API_BASE_URL}/lookups`, async () => {
    await delay(200);
    return HttpResponse.json({
        items: db.items,
        uoms: db.uoms,
        taxes: db.taxes,
        withholdings: db.withholdings,
        costCenters: db.costCenters,
        projects: db.projects,
        currencies: db.currencies,
        vendors: db.vendors,
    });
  }),

  // --- Budget Check Handler ---
  http.post(`${API_BASE_URL}/budget/check`, async ({ request }) => {
    await delay(600);
    const { totalAmount } = await request.json() as { totalAmount: number };
    const remainingBudget = 5000000; // Mock budget
    const isSufficient = totalAmount <= remainingBudget;
    return HttpResponse.json({
      totalBudget: 10000000,
      totalCommitted: 3000000,
      totalActual: 2000000,
      remainingBudget,
      isSufficient,
    });
  }),

  // --- PR Handlers ---
  http.get(`${API_BASE_URL}/pr`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const isApprovedForRfq = url.searchParams.get('isApprovedForRfq') === 'true';
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    let allPrs = [...db.prs];

    if (isApprovedForRfq) {
        allPrs = allPrs.filter(pr => pr.status === DocStatus.APPROVED);
    }
    
    let filteredData = allPrs.sort((a,b) => new Date(b.docDate!).getTime() - new Date(a.docDate!).getTime());
    
    const paginatedData = filteredData.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(filteredData.length / perPage),
            total: filteredData.length,
        }
    });
  }),

  http.get(`${API_BASE_URL}/pr/:id`, async ({ params }) => {
    await delay(300);
    const { id } = params;
    const pr = db.prs.find(p => p.id === id);

    if (!pr) {
        return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(pr);
  }),

  http.post(`${API_BASE_URL}/pr`, async ({ request }) => withIdempotency(request, async () => {
    await delay(700);
    const newPrData = await request.json() as Omit<PR, 'id' | 'createdAt' | 'updatedAt'>;
    
    if (newPrData.remarks?.toLowerCase().includes('trigger-error')) {
        return HttpResponse.json({
            message: "Validation failed",
            fieldErrors: {
                remarks: "Remarks tidak boleh mengandung kata 'error'."
            }
        }, { status: 422 });
    }
    
    const newPr: PR = {
        ...newPrData,
        id: `pr-${Date.now()}`,
        docNo: `PR-2024-${String(db.prs.length + 1).padStart(5, '0')}`,
        status: DocStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        docDate: new Date(newPrData.docDate!).toISOString(),
    };

    db.prs.unshift(newPr);
    return HttpResponse.json(newPr, { status: 201 });
  })),

  http.put(`${API_BASE_URL}/pr/:id`, async ({ params, request }) => {
    await delay(400);
    const { id } = params;
    const updatedPrData = await request.json() as PR;
    const prIndex = db.prs.findIndex(p => p.id === id);

    if (prIndex === -1) {
        return new HttpResponse(null, { status: 404 });
    }

    db.prs[prIndex] = {
        ...db.prs[prIndex],
        ...updatedPrData,
        updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(db.prs[prIndex]);
  }),

  http.post(`${API_BASE_URL}/pr/:id/submit`, async ({ request, params }) => withIdempotency(request, async () => {
    await delay(800);
    const { id } = params;
    const prIndex = db.prs.findIndex(p => p.id === id);

    if (prIndex === -1) {
        return new HttpResponse(null, { status: 404 });
    }

    if (db.prs[prIndex].status !== DocStatus.DRAFT) {
         return HttpResponse.json({ message: 'Hanya PR draft yang bisa di-submit.' }, { status: 400 });
    }
    
    db.prs[prIndex].status = DocStatus.SUBMITTED;
    db.prs[prIndex].updatedAt = new Date().toISOString();

    return HttpResponse.json(db.prs[prIndex]);
  })),

  // --- RFQ Handlers ---
   http.get(`${API_BASE_URL}/rfq`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    let filteredData = [...db.rfqs].sort((a,b) => new Date(b.docDate!).getTime() - new Date(a.docDate!).getTime());
    
    const paginatedData = filteredData.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(db.rfqs.length / perPage),
            total: db.rfqs.length,
        }
    });
  }),
  
  http.get(`${API_BASE_URL}/rfq/:id`, async ({ params }) => {
    await delay(300);
    const { id } = params;
    const rfq = db.rfqs.find(r => r.id === id);
    if (!rfq) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(rfq);
  }),

  http.get(`${API_BASE_URL}/rfq/:id/bids`, async ({ params }) => {
    await delay(600);
    const { id } = params;
    const rfq = db.rfqs.find(r => r.id === id);
    if (!rfq) {
        return new HttpResponse(null, { status: 404 });
    }
    const rfqLineIds = rfq.lines.map(l => l.id);
    const bids = db.rfqBids.filter(b => rfqLineIds.includes(b.rfqLineId));

    return HttpResponse.json({ rfq, bids });
  }),

  http.post(`${API_BASE_URL}/rfq`, async ({ request }) => withIdempotency(request, async () => {
    await delay(700);
    const newRfqData = await request.json() as Partial<RFQ>;
    
    const newRfq: RFQ = {
        id: `rfq-${Date.now()}`,
        docNo: `RFQ-2024-${String(db.rfqs.length + 1).padStart(5, '0')}`,
        status: DocStatus.SUBMITTED,
        docDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newRfqData,
    } as RFQ;

    db.rfqs.unshift(newRfq);
    return HttpResponse.json(newRfq, { status: 201 });
  })),

  http.post(`${API_BASE_URL}/rfq/:id/award`, async ({ request, params }) => withIdempotency(request, async () => {
    await delay(1000);
    const { id } = params;
    const { awards } = await request.json() as { awards: any[] };
    const rfqIndex = db.rfqs.findIndex(r => r.id === id);

    if (rfqIndex === -1) {
        return new HttpResponse(null, { status: 404 });
    }

    db.rfqs[rfqIndex].status = DocStatus.CLOSED;
    db.rfqs[rfqIndex].awardedVendors = awards;
    db.rfqs[rfqIndex].updatedAt = new Date().toISOString();

    const responseBody = { message: "Award berhasil disimpan. Siap untuk membuat PO." };
    return HttpResponse.json(responseBody);
  })),

  // --- PO Handlers ---
  http.get(`${API_BASE_URL}/po`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const status = url.searchParams.get('status');
    const poType = url.searchParams.get('poType');

    let allPOs = [...db.pos];

    if (status) {
      allPOs = allPOs.filter(po => po.status === status);
    }
     if (poType) {
      allPOs = allPOs.filter(po => po.poType === poType);
    }
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    let filteredData = allPOs.sort((a,b) => new Date(b.docDate!).getTime() - new Date(a.docDate!).getTime());
    
    const paginatedData = filteredData.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(filteredData.length / perPage),
            total: filteredData.length,
        }
    });
  }),

  http.get(`${API_BASE_URL}/po/:id`, async ({ params }) => {
    await delay(300);
    const { id } = params;
    const po = db.pos.find(p => p.id === id);
    if (!po) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(po);
  }),
  
  http.post(`${API_BASE_URL}/po`, async ({ request }) => withIdempotency(request, async () => {
    await delay(700);
    const newPOData = await request.json() as Partial<PO>;
    
    const newPO: PO = {
        id: `po-${Date.now()}`,
        docNo: `PO-2024-${String(db.pos.length + 1).padStart(5, '0')}`,
        status: DocStatus.APPROVED, // POs are created as Approved, waiting for Release
        docDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newPOData,
    } as PO;

    db.pos.unshift(newPO);
    return HttpResponse.json(newPO, { status: 201 });
  })),

  http.post(`${API_BASE_URL}/po/:id/release`, async ({ request, params }) => withIdempotency(request, async () => {
    await delay(800);
    const { id } = params;
    const poIndex = db.pos.findIndex(p => p.id === id);

    if (poIndex === -1) {
        return new HttpResponse(null, { status: 404 });
    }

    if (db.pos[poIndex].status !== DocStatus.APPROVED) {
         return HttpResponse.json({ message: 'Hanya PO status APPROVED yang bisa di-release.' }, { status: 400 });
    }
    
    db.pos[poIndex].status = DocStatus.RELEASED;
    db.pos[poIndex].updatedAt = new Date().toISOString();

    return HttpResponse.json(db.pos[poIndex]);
  })),

  // --- GRN Handlers ---
  http.get(`${API_BASE_URL}/grn`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const poId = url.searchParams.get('poId');

    if (poId) {
        const data = db.grns.filter(g => g.poId === poId);
        return HttpResponse.json(data);
    }
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    let filteredData = [...db.grns].sort((a,b) => new Date(b.docDate!).getTime() - new Date(a.docDate!).getTime());
    
    const paginatedData = filteredData.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(db.grns.length / perPage),
            total: db.grns.length,
        }
    });
  }),

  http.post(`${API_BASE_URL}/grn`, async ({ request }) => withIdempotency(request, async () => {
    await delay(700);
    const newGrnData = await request.json() as Partial<GoodsReceipt>;
    
    const newGrn: GoodsReceipt = {
        id: `grn-${Date.now()}`,
        docNo: `GRN-2024-${String(db.grns.length + 1).padStart(5, '0')}`,
        status: DocStatus.POSTED,
        docDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newGrnData,
    } as GoodsReceipt;

    db.grns.unshift(newGrn);
    return HttpResponse.json(newGrn, { status: 201 });
  })),

  // --- SES Handlers ---
  http.get(`${API_BASE_URL}/ses`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    let filteredData = [...db.ses].sort((a,b) => new Date(b.docDate!).getTime() - new Date(a.docDate!).getTime());
    
    const paginatedData = filteredData.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(db.ses.length / perPage),
            total: db.ses.length,
        }
    });
  }),
  
  http.post(`${API_BASE_URL}/ses`, async ({ request }) => withIdempotency(request, async () => {
    await delay(700);
    const newSesData = await request.json() as Partial<ServiceEntry> & { poId: string, lines: any[] };
    
    const po = db.pos.find(p => p.id === newSesData.poId);
    if (!po) {
        return HttpResponse.json({ message: 'PO tidak ditemukan' }, { status: 404 });
    }

    const totalAmount = newSesData.lines.reduce((acc, line) => acc + line.claimedAmount, 0);
    const retentionAmount = totalAmount * (newSesData.retentionPercentage! / 100);

    const newSes: ServiceEntry = {
        id: `ses-${Date.now()}`,
        docNo: `SES-2024-${String(db.ses.length + 1).padStart(5, '0')}`,
        status: DocStatus.ACCEPTED,
        docDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        po,
        ...newSesData,
        totalAmount,
        retentionAmount,
    } as ServiceEntry;

    db.ses.unshift(newSes);
    return HttpResponse.json(newSes, { status: 201 });
  })),

   // --- Invoice Handlers ---
  http.get(`${API_BASE_URL}/invoices`, async ({ request }) => {
    await delay(450);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const poId = url.searchParams.get('poId');
    const status = url.searchParams.get('status');
    const paymentStatus = url.searchParams.get('paymentStatus');
    const dueDateFrom = url.searchParams.get('dueDateFrom');
    const dueDateTo = url.searchParams.get('dueDateTo');

    let allInvoices = [...db.invoices];

    if (poId) allInvoices = allInvoices.filter(i => i.poId === poId);
    if (status) allInvoices = allInvoices.filter(i => i.status === status);
    if (paymentStatus) allInvoices = allInvoices.filter(i => i.paymentStatus === paymentStatus);
    if (dueDateFrom) allInvoices = allInvoices.filter(i => new Date(i.dueDate) >= new Date(dueDateFrom));
    if (dueDateTo) allInvoices = allInvoices.filter(i => new Date(i.dueDate) <= new Date(dueDateTo));
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    const paginatedData = allInvoices.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(allInvoices.length / perPage),
            total: allInvoices.length,
        }
    });
  }),

  http.get(`${API_BASE_URL}/invoices/:id`, async ({ params }) => {
    await delay(300);
    const { id } = params;
    const invoice = db.invoices.find(i => i.id === id);
    if (!invoice) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(invoice);
  }),

  http.post(`${API_BASE_URL}/invoices/check-duplicate`, async ({ request }) => {
    await delay(400);
    const { vendorInvoiceNo, vendorId } = await request.json() as { vendorInvoiceNo: string, vendorId: string };
    const existing = db.invoices.find(i => i.vendorInvoiceNo === vendorInvoiceNo && i.vendorId === vendorId);
    if (existing) {
        return HttpResponse.json({ isDuplicate: true, existingInvoiceId: existing.id });
    }
    return HttpResponse.json({ isDuplicate: false });
  }),

  http.post(`${API_BASE_URL}/invoices`, async ({ request }) => withIdempotency(request, async () => {
    await delay(700);
    const newInvoiceData = await request.json() as Partial<Invoice>;
    
    const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        docNo: `FINV-2024-${String(db.invoices.length + 1).padStart(5, '0')}`,
        status: DocStatus.SUBMITTED,
        paymentStatus: 'UNPAID',
        docDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newInvoiceData,
    } as Invoice;

    db.invoices.unshift(newInvoice);
    return HttpResponse.json(newInvoice, { status: 201 });
  })),
  
  http.post(`${API_BASE_URL}/invoices/:id/approve`, async ({ request, params }) => withIdempotency(request, async () => {
    await delay(600);
    const { id } = params;
    const invoiceIndex = db.invoices.findIndex(i => i.id === id);
    if (invoiceIndex === -1) {
        return new HttpResponse(null, { status: 404 });
    }
    if (db.invoices[invoiceIndex].status !== DocStatus.SUBMITTED) {
        return HttpResponse.json({ message: "Hanya faktur SUBMITTED yang dapat disetujui." }, { status: 400 });
    }
    db.invoices[invoiceIndex].status = DocStatus.APPROVED;
    return HttpResponse.json(db.invoices[invoiceIndex]);
  })),

  // --- Payment Handlers ---
  http.get(`${API_BASE_URL}/payments`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');

    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    let filteredData = [...db.payments].sort((a,b) => new Date(b.docDate!).getTime() - new Date(a.docDate!).getTime());
    
    const paginatedData = filteredData.slice(start, end);

    return HttpResponse.json({
        data: paginatedData,
        meta: {
            currentPage: page,
            perPage,
            totalPages: Math.ceil(filteredData.length / perPage),
            total: filteredData.length,
        }
    });
  }),
  
  http.post(`${API_BASE_URL}/payments/execute`, async ({ request }) => withIdempotency(request, async () => {
    await delay(1200);
    const { invoiceIds, bankFee } = await request.json() as { invoiceIds: string[], bankFee: number };
    
    let totalPaid = bankFee;
    const paymentLines: PaymentLine[] = [];

    invoiceIds.forEach(id => {
        const invoiceIndex = db.invoices.findIndex(i => i.id === id);
        if (invoiceIndex !== -1) {
            db.invoices[invoiceIndex].paymentStatus = 'PAID';
            db.invoices[invoiceIndex].updatedAt = new Date().toISOString();
            totalPaid += db.invoices[invoiceIndex].grandTotal;
            paymentLines.push({
                id: `payl-${id}`,
                invoiceId: id,
                amountPaid: db.invoices[invoiceIndex].grandTotal,
            });
        }
    });

    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        docNo: `PAY-2024-${String(db.payments.length + 1).padStart(5, '0')}`,
        docDate: new Date().toISOString(),
        status: DocStatus.POSTED,
        paymentMethod: 'TRANSFER',
        bankAccount: 'BCA - 1234567890',
        totalPaid,
        lines: paymentLines,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
    
    db.payments.unshift(newPayment);
    
    return HttpResponse.json(newPayment, { status: 201 });
  })),

  // --- Reports Handlers ---
  http.get(`${API_BASE_URL}/reports/spend-analysis`, async ({ request }) => {
    await delay(800);
    const paidInvoices = db.invoices.filter(i => i.paymentStatus === 'PAID');
    // For this mock, we'll use PR cost centers as a proxy for invoice cost centers
    const spendByCategory: { [key: string]: SpendAnalysisData } = {};

    db.prs.forEach(pr => {
      const category = pr.costCenter?.name ?? 'Uncategorized';
      if (!spendByCategory[category]) {
        spendByCategory[category] = { category, totalAmount: 0, byMonth: [] };
      }
      spendByCategory[category].totalAmount += pr.totalAmount;
      const month = new Date(pr.docDate!).getMonth() + 1;
      const monthSpend = spendByCategory[category].byMonth.find(m => m.month === month);
      if (monthSpend) {
        monthSpend.totalAmount += pr.totalAmount;
      } else {
        spendByCategory[category].byMonth.push({ month, totalAmount: pr.totalAmount });
      }
    });

    return HttpResponse.json(Object.values(spendByCategory));
  }),

  http.get(`${API_BASE_URL}/reports/ap-aging`, async () => {
    await delay(600);
    const today = new Date();
    const unpaidInvoices = db.invoices.filter(i => i.paymentStatus === 'UNPAID' && i.status === DocStatus.APPROVED);
    
    const agingData: APAgingData[] = unpaidInvoices.map(inv => {
      const daysOverdue = differenceInDays(today, new Date(inv.dueDate));
      let bucket: AgingBucket = '>90';
      if (daysOverdue <= 30) bucket = '0-30';
      else if (daysOverdue <= 60) bucket = '31-60';
      else if (daysOverdue <= 90) bucket = '61-90';

      return {
        vendorName: inv.vendor!.name,
        invoiceNo: inv.vendorInvoiceNo,
        dueDate: inv.dueDate,
        amount: inv.grandTotal,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      };
    });

    return HttpResponse.json(agingData);
  }),

  http.get(`${API_BASE_URL}/reports/open-pos`, async () => {
    await delay(700);
    const openPOs = db.pos.filter(p => p.status === DocStatus.RELEASED);
    const openPOData: OpenPOData[] = [];

    openPOs.forEach(po => {
      po.lines.forEach(line => {
        const receivedQty = db.grns.flatMap(g => g.lines)
                                  .filter(gl => gl.poLineId === line.id)
                                  .reduce((sum, gl) => sum + gl.receivedQty, 0);
        const remainingQty = line.quantity - receivedQty;

        if (remainingQty > 0) {
          openPOData.push({
            poId: po.id,
            poDocNo: po.docNo!,
            poDate: po.docDate!,
            vendorName: po.vendor!.name,
            lineId: line.id,
            itemName: line.item?.name ?? line.description,
            orderedQty: line.quantity,
            receivedQty,
            remainingQty,
            eta: line.schedules[0]?.deliveryDate ?? 'N/A',
          });
        }
      });
    });
    
    // If all lines of a PO are fully received, update its status to CLOSED
    openPOs.forEach(po => {
        const isFullyReceived = po.lines.every(line => {
             const receivedQty = db.grns.flatMap(g => g.lines)
                                  .filter(gl => gl.poLineId === line.id)
                                  .reduce((sum, gl) => sum + gl.receivedQty, 0);
            return receivedQty >= line.quantity;
        });
        if (isFullyReceived) {
            const poInDb = db.pos.find(p => p.id === po.id);
            if(poInDb) poInDb.status = DocStatus.CLOSED;
        }
    });

    return HttpResponse.json(openPOData);
  }),
  
  http.get(`${API_BASE_URL}/reports/vendor-performance`, async () => {
    await delay(1000);
    const performanceData: VendorPerformanceData[] = [];

    db.vendors.forEach(vendor => {
        const vendorPOs = db.pos.filter(p => p.vendorId === vendor.id);
        if (vendorPOs.length === 0) return;

        let onTimeDeliveries = 0;
        let totalDeliveries = 0;

        vendorPOs.forEach(po => {
            po.lines.forEach(line => {
                const schedule = line.schedules[0];
                if (!schedule) return;
                
                const grnLines = db.grns.flatMap(g => g.lines).filter(gl => gl.poLineId === line.id);
                grnLines.forEach(gl => {
                    totalDeliveries++;
                    const grn = db.grns.find(g => g.lines.some(l => l.id === gl.id));
                    if (grn && new Date(grn.docDate!) <= new Date(schedule.deliveryDate)) {
                        onTimeDeliveries++;
                    }
                });
            });
        });

        performanceData.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            onTimeDeliveryRate: totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 100,
            qualityScore: vendor.qualityScore ?? 80,
            avgPriceCompetitiveness: 98.5, // Mock data
            totalPOs: vendorPOs.length,
        });
    });

    return HttpResponse.json(performanceData);
  }),
];
