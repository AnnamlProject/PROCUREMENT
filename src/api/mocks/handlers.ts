import { http, HttpResponse, delay } from 'msw';
import * as db from './db';
import { DocStatus } from '../types/core';
import { GoodsReceipt, PO, PR, RFQ, ServiceEntry } from '../types/purchasing';

const API_BASE_URL = '/api';

export const handlers = [
  // --- Lookups Handler ---
  http.get(`${API_BASE_URL}/lookups`, async () => {
    await delay(200);
    return HttpResponse.json({
        items: db.items,
        uoms: db.uoms,
        taxes: db.taxes,
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

  http.post(`${API_BASE_URL}/pr`, async ({ request }) => {
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
  }),

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

  http.post(`${API_BASE_URL}/pr/:id/submit`, async ({ params }) => {
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
  }),

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

  http.post(`${API_BASE_URL}/rfq`, async ({ request }) => {
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
  }),

  http.post(`${API_BASE_URL}/rfq/:id/award`, async ({ params, request }) => {
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

    return HttpResponse.json({ message: "Award berhasil disimpan. Siap untuk membuat PO." });
  }),

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
  
  http.post(`${API_BASE_URL}/po`, async ({ request }) => {
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
  }),

  http.post(`${API_BASE_URL}/po/:id/release`, async ({ params }) => {
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
  }),

  // --- GRN Handlers ---
  http.get(`${API_BASE_URL}/grn`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    
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

  http.post(`${API_BASE_URL}/grn`, async ({ request }) => {
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
  }),

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
  
  http.post(`${API_BASE_URL}/ses`, async ({ request }) => {
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
  }),
];