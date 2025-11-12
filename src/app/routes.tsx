import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { GRNListPage } from '@/pages/GRNListPage';
import GRNPostPage from '@/pages/grn/GRNPostPage';
import { InvoicesListPage } from '@/pages/InvoicesListPage';
import InvoiceViewPage from '@/pages/invoices/InvoiceViewPage';
import InvoiceWizardPage from '@/pages/invoices/InvoiceWizardPage';
import { PaymentsListPage } from '@/pages/PaymentsListPage';
import PaymentRunPage from '@/pages/payments/PaymentRunPage';
import { POListPage } from '@/pages/POListPage';
import POViewPage from '@/pages/po/POViewPage';
import POWizardPage from '@/pages/po/POWizardPage';
import { PRListPage } from '@/pages/PRListPage';
import PREditPage from '@/pages/pr/PREditPage';
import { ReportsPage } from '@/pages/ReportsPage';
import APAgingPage from '@/pages/reports/APAgingPage';
import OpenPOPage from '@/pages/reports/OpenPOPage';
import SpendAnalysisPage from '@/pages/reports/SpendAnalysisPage';
import VendorPerformancePage from '@/pages/reports/VendorPerformancePage';
import { RFQListPage } from '@/pages/RFQListPage';
import BidTabulationPage from '@/pages/rfq/BidTabulationPage';
import RFQWizardPage from '@/pages/rfq/RFQWizardPage';
import { SESListPage } from '@/pages/SESListPage';
import SESWizardPage from '@/pages/ses/SESWizardPage';
import { Route, Routes } from 'react-router-dom';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="purchasing/pr" element={<PRListPage />} />
        <Route path="purchasing/pr/new" element={<PREditPage />} />
        <Route path="purchasing/pr/edit/:id" element={<PREditPage />} />
        <Route path="purchasing/rfq" element={<RFQListPage />} />
        <Route path="purchasing/rfq/new" element={<RFQWizardPage />} />
        <Route path="purchasing/rfq/:id/bid-tabulation" element={<BidTabulationPage />} />
        <Route path="purchasing/po" element={<POListPage />} />
        <Route path="purchasing/po/new" element={<POWizardPage />} />
        <Route path="purchasing/po/view/:id" element={<POViewPage />} />
        <Route path="receiving/grn" element={<GRNListPage />} />
        <Route path="receiving/grn/new" element={<GRNPostPage />} />
        <Route path="services/ses" element={<SESListPage />} />
        <Route path="services/ses/new" element={<SESWizardPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="invoices/new" element={<InvoiceWizardPage />} />
        <Route path="invoices/view/:id" element={<InvoiceViewPage />} />
        <Route path="payments" element={<PaymentsListPage />} />
        <Route path="payments/new-run" element={<PaymentRunPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/spend-analysis" element={<SpendAnalysisPage />} />
        <Route path="reports/ap-aging" element={<APAgingPage />} />
        <Route path="reports/open-pos" element={<OpenPOPage />} />
        <Route path="reports/vendor-performance" element={<VendorPerformancePage />} />
      </Route>
    </Routes>
  );
};
