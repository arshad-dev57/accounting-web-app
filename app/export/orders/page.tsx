'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  Plus,
  Send,
  PackageCheck,
  Receipt,
  ExternalLink,
  ShoppingCart,
  Boxes,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradeDetailDrawer,
  TradeWorkflowStepper,
  ErpLinkedBanner,
} from '../../../components/trade/TradeUI';
import { useTradeStore } from '../../../lib/mock/trade-store';
import { useCurrency } from '../../../lib/currency-context';
import type { ExportSalesOrder } from '../../../lib/mock/trade-data';

const EXPORT_WORKFLOW_STEPS = [
  'Inquiry',
  'Quotation',
  'Sales Order',
  'Proforma Invoice',
  'Packing & Inspection',
  'Customs Declaration',
  'Dispatch / Shipment',
  'Commercial Invoice',
  'Settlement',
];

export default function ExportOrdersPage() {
  const { state, updateState } = useTradeStore();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<ExportSalesOrder | null>(null);

  const filtered = state.exportOrders.filter((ord) => {
    const matchSearch =
      ord.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerCountry.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || ord.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = (orderId: string, status: ExportSalesOrder['status']) => {
    updateState((s) => {
      const target = s.exportOrders.find((o) => o.id === orderId);
      if (target) target.status = status;
    });
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Sales Orders"
        subtitle="Confirmed overseas buyer sales contracts, international delivery terms, packing and dispatch management"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileCheck2 className="w-5 h-5 text-white" />}
        actions={
          <Link
            href="/sales/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
          >
            <ExternalLink className="w-4 h-4" /> Open Sales Module Orders
          </Link>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Export Sales Orders"
        erpModuleLabel="Sales Orders"
        erpHref="/sales/orders"
        description="Export channel view of sales orders. Create and fulfill orders in Sales so packing, dispatch, and invoicing stay on the existing Sales flow."
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={2} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search export order, customer, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {['All', 'Confirmed', 'In Production / Packing', 'On Board Vessel', 'Completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-[#014582] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Order No', 'Order Date', 'Customer', 'Destination Port', 'Incoterm', 'Total Contract', 'Advance Received', 'Balance Due', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((ord) => (
              <TradeTableRow key={ord.id}>
                <TradeTableCell className="font-bold text-[#014582]">{ord.orderNumber}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{ord.orderDate}</TradeTableCell>
                <TradeTableCell>
                  <span className="font-semibold text-gray-900 block">{ord.customerName}</span>
                  <span className="text-[10px] text-gray-400">{ord.customerCountry}</span>
                </TradeTableCell>
                <TradeTableCell className="text-xs text-gray-700">{ord.destinationPort}</TradeTableCell>
                <TradeTableCell>
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                    {ord.incoterm}
                  </span>
                </TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{formatAmount(ord.totalOrderUsd)}</TradeTableCell>
                <TradeTableCell className="font-semibold text-emerald-700">
                  {formatAmount(ord.advanceReceivedUsd)}
                </TradeTableCell>
                <TradeTableCell className="font-bold text-rose-700">
                  {formatAmount(ord.outstandingBalanceUsd)}
                </TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={ord.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </TradeTableCell>
              </TradeTableRow>
            ))}
          </TradeTableBody>
        </TradeTable>
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.orderNumber || 'Export Sales Order'}
        subtitle={`Customer: ${selectedOrder?.customerName}`}
        actions={
          selectedOrder && (
            <div className="flex items-center gap-2">
              {selectedOrder.status === 'Confirmed' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'In Production / Packing')}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" /> Move to Packing & Inspection
                </button>
              )}
              <Link
                href="/export/packing"
                className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold hover:bg-gray-200 transition-all flex items-center gap-1.5"
              >
                Packing List
              </Link>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Order Number</span>
                <span className="font-bold text-gray-900">{selectedOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Destination Port</span>
                <span className="font-semibold text-gray-900">{selectedOrder.destinationPort}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Delivery Deadline</span>
                <span className="font-bold text-gray-900">{selectedOrder.deliveryDeadline}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Incoterm</span>
                <span className="font-bold text-gray-900">{selectedOrder.incoterm}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Order Value</span>
                <span className="font-extrabold text-[#014582] text-sm">{formatAmount(selectedOrder.totalOrderUsd)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Receivables Balance</span>
                <span className="font-extrabold text-rose-700">{formatAmount(selectedOrder.outstandingBalanceUsd)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Export Order Items</h4>
              <TradeTable>
                <TradeTableHeader columns={['SKU', 'Item Name', 'Quantity', 'Unit Price (USD)', 'Line Total']} />
                <TradeTableBody>
                  {selectedOrder.items.map((it, idx) => (
                    <TradeTableRow key={idx}>
                      <TradeTableCell className="font-mono">{it.sku}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">{it.quantity} {it.uom}</TradeTableCell>
                      <TradeTableCell>${it.unitPriceUsd}</TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">${it.totalAmountUsd.toLocaleString()}</TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-950 text-xs">Connected with Sales Orders Master</p>
                <p className="text-[11px] text-emerald-700">
                  Shared customer reference and delivery staging with Bisonstechs Sales module.
                </p>
              </div>
              <Link
                href="/sales/orders"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                Open in Sales <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
