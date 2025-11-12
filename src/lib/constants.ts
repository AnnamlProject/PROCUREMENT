// FIX: Import React to use React.createElement.
import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Wrench,
  FileText,
  CreditCard,
  BarChart2,
  PieChart,
  Clock,
  BookOpen,
  Users,
} from 'lucide-react';

export type NavItem = {
  title: string;
  path: string;
  // FIX: Changed JSX.Element to React.ReactElement to be compatible with .ts files.
  icon: React.ReactElement;
  submenu?: NavItem[];
};

export const SIDENAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: React.createElement(LayoutDashboard, { size: 20 }),
  },
  {
    title: 'Purchasing',
    path: '/purchasing',
    icon: React.createElement(ShoppingCart, { size: 20 }),
    submenu: [
      {
        title: 'Purchase Requisition (PR)',
        path: '/purchasing/pr',
        icon: React.createElement(FileText, { size: 18 }),
      },
      {
        title: 'Request for Quotation (RFQ)',
        path: '/purchasing/rfq',
        icon: React.createElement(FileText, { size: 18 }),
      },
      {
        title: 'Purchase Order (PO)',
        path: '/purchasing/po',
        icon: React.createElement(FileText, { size: 18 }),
      },
    ],
  },
  {
    title: 'Receiving',
    path: '/receiving',
    icon: React.createElement(Truck, { size: 20 }),
    submenu: [
      {
        title: 'Goods Receipt Note (GRN)',
        path: '/receiving/grn',
        icon: React.createElement(FileText, { size: 18 }),
      },
    ],
  },
  {
    title: 'Services',
    path: '/services',
    icon: React.createElement(Wrench, { size: 20 }),
    submenu: [
      {
        title: 'Service Entry Sheet (SES)',
        path: '/services/ses',
        icon: React.createElement(FileText, { size: 18 }),
      },
    ],
  },
  {
    title: 'Invoices',
    path: '/invoices',
    icon: React.createElement(Receipt, { size: 20 }),
  },
  {
    title: 'Payments',
    path: '/payments',
    icon: React.createElement(CreditCard, { size: 20 }),
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: React.createElement(BarChart2, { size: 20 }),
    submenu: [
        {
            title: 'Analisis Pengeluaran',
            path: '/reports/spend-analysis',
            icon: React.createElement(PieChart, { size: 18 }),
        },
        {
            title: 'Umur Utang (AP Aging)',
            path: '/reports/ap-aging',
            icon: React.createElement(Clock, { size: 18 }),
        },
        {
            title: 'Open PO',
            path: '/reports/open-pos',
            icon: React.createElement(BookOpen, { size: 18 }),
        },
        {
            title: 'Kinerja Vendor',
            path: '/reports/vendor-performance',
            icon: React.createElement(Users, { size: 18 }),
        },
    ]
  },
];
