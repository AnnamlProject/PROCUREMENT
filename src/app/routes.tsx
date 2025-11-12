
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { GRNListPage } from '@/pages/GRNListPage';
import { InvoicesListPage } from '@/pages/InvoicesListPage';
import { PaymentsListPage } from '@/pages/PaymentsListPage';
import { POListPage } from '@/pages/POListPage';
import { PRListPage } from '@/pages/PRListPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RFQListPage } from '@/pages/RFQListPage';
import { SESListPage } from '@/pages/SESListPage';
import { Route, Routes } from 'react-router-dom';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="purchasing/pr" element={<PRListPage />} />
        <Route path="purchasing/rfq" element={<RFQListPage />} />
        <Route path="purchasing/po" element={<POListPage />} />
        <Route path="receiving/grn" element={<GRNListPage />} />
        <Route path="services/ses" element={<SESListPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="payments" element={<PaymentsListPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
};
