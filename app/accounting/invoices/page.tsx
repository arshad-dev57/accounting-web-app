'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  FileText,
  ArrowRight,
  TrendingUp,
  Package,
  Users,
  Building2,
  CheckCircle2,
  DollarSign,
  CreditCard,
  ShoppingCart,
  ClipboardList
} from 'lucide-react';

export default function InvoicesNavigationPage() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
            <Receipt className="w-3.5 h-3.5" /> Accounting Invoices Hub
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Invoices & Billing Center
          </h1>
          <p className="text-sm md:text-base text-gray-300">
            Select a scenario below to manage customer sales invoices or vendor purchase invoices with full backend tracking and inventory integration.
          </p>
        </div>
      </div>

      {/* Dual Scenario Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario 1: Sales Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Accounts Receivable
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
              Sales Invoices
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Create and manage customer sales invoices, issue digital receipts, track outstanding receivables, and view sales performance metrics.
            </p>

            <div className="space-y-2.5 mb-8">
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Customer Invoicing & Digital Email Receipts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Sales Orders & Quotation Conversion</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Accounts Receivable & Customer Ledger Tracking</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-100">
            <Link
              href="/sales/invoices"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/20"
            >
              <span>Open Sales Invoices</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sales/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-gray-200"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Go to Sales Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Scenario 2: Purchase Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#014582] group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Accounts Payable
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#014582] transition-colors mb-2">
              Purchase Invoices
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Create and manage vendor purchase invoices, link Goods Receiving Notes (GRNs) or Purchase Orders, track payables and vendor balances.
            </p>

            <div className="space-y-2.5 mb-8">
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Multi-GRN & Standalone GRN Invoicing</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Purchase Order Billing & Inventory Auto-Stocking</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Vendor Accounts Payable & Payment Tracking</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-100">
            <Link
              href="/purchases/invoices"
              className="w-full py-3 px-4 rounded-xl bg-[#014582] hover:bg-[#013566] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#014582]/20"
            >
              <span>Open Purchase Invoices</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/purchases/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-gray-200"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Go to Purchases Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
