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
  },
];