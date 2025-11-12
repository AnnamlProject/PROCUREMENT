
// FIX: Import React to make the JSX namespace available.
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
  icon: JSX.Element;
  submenu?: NavItem[];
};

export const SIDENAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} />,
  },
  {
    title: 'Purchasing',
    path: '/purchasing', // FIX: Added missing comma
    icon: <ShoppingCart size={20} />,
    submenu: [
      {
        title: 'Purchase Requisition (PR)',
        path: '/purchasing/pr', // FIX: Added missing comma
        icon: <FileText size={18} />,
      },
      {
        title: 'Request for Quotation (RFQ)',
        path: '/purchasing/rfq', // FIX: Added missing comma
        icon: <FileText size={18} />,
      },
      {
        title: 'Purchase Order (PO)',
        path: '/purchasing/po',
        icon: <FileText size={18} />,
      },
    ],
  },
  {
    title: 'Receiving',
    path: '/receiving', // FIX: Added missing comma
    icon: <Truck size={20} />,
    submenu: [
      {
        title: 'Goods Receipt Note (GRN)',
        path: '/receiving/grn',
        icon: <FileText size={18} />,
      },
    ],
  },
  {
    title: 'Services',
    path: '/services', // FIX: Added missing comma
    icon: <Wrench size={20} />,
    submenu: [
      {
        title: 'Service Entry Sheet (SES)',
        path: '/services/ses',
        icon: <FileText size={18} />,
      },
    ],
  },
  {
    title: 'Invoices',
    path: '/invoices',
    icon: <Receipt size={20} />,
  },
  {
    title: 'Payments',
    path: '/payments',
    icon: <CreditCard size={20} />,
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <BarChart2 size={20} />,
  },
];