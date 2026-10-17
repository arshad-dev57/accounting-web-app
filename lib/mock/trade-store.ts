'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_IMPORT_RFQS,
  INITIAL_IMPORT_POS,
  INITIAL_IMPORT_PROFORMA_INVOICES,
  INITIAL_IMPORT_SHIPMENTS,
  INITIAL_IMPORT_CUSTOMS,
  INITIAL_IMPORT_DOCUMENTS,
  INITIAL_IMPORT_GRNS,
  INITIAL_LANDED_COSTS,
  INITIAL_IMPORT_FINANCE_LCS,
  INITIAL_IMPORT_BILLS,
  INITIAL_EXPORT_INQUIRIES,
  INITIAL_EXPORT_QUOTATIONS,
  INITIAL_EXPORT_ORDERS,
  INITIAL_EXPORT_PROFORMAS,
  INITIAL_EXPORT_PACKINGS,
  INITIAL_EXPORT_SHIPMENTS,
  INITIAL_EXPORT_CUSTOMS,
  INITIAL_EXPORT_DOCUMENTS,
  INITIAL_EXPORT_DISPATCHES,
  INITIAL_EXPORT_FINANCE_LCS,
  INITIAL_EXPORT_RECEIPTS,
  INITIAL_TRADING_STOCK,
  INITIAL_TRADING_PRICE_LISTS,
  INITIAL_TRADING_CUSTOMER_PRICING,
  INITIAL_TRADING_MARGINS,
  INITIAL_TRADING_POS,
  INITIAL_TRADING_SUPPLIER_QUOTES,
  INITIAL_TRADING_GOODS_RECEIVING,
  INITIAL_TRADING_SALES_QUOTATIONS,
  INITIAL_TRADING_SALES_ORDERS,
  INITIAL_TRADING_CUSTOMER_ORDERS,
  INITIAL_TRADING_DELIVERIES,
  INITIAL_TRADING_INVOICES,
  INITIAL_TRADING_SALES_RETURNS,
  INITIAL_TRADING_PURCHASE_RETURNS,
  TRADE_PRODUCTS,
  TRADE_SUPPLIERS,
  TRADE_CUSTOMERS,
  type TradeSupplier,
  type TradeCustomer,
  type TradeProduct,
  type ImportRfq,
  type ImportPurchaseOrder,
  type ImportProformaInvoice,
  type ImportShipment,
  type ImportCustomsClearance,
  type ImportDocument,
  type ImportGRN,
  type LandedCostAllocation,
  type ImportFinanceLC,
  type ImportSupplierBill,
  type ExportInquiry,
  type ExportQuotation,
  type ExportSalesOrder,
  type ExportProformaInvoice,
  type ExportPackingAndInspection,
  type ExportShipment,
  type ExportCustomsDeclaration,
  type ExportDocument,
  type ExportDispatch,
  type ExportFinanceLC,
  type ExportReceiptSettlement,
  type TradingStockOverviewItem,
  type TradingPriceList,
  type TradingCustomerPricing,
  type TradingMarginAnalysis,
  type TradingPurchaseOrder,
  type TradingSupplierQuote,
  type TradingGoodsReceiving,
  type TradingSalesQuotation,
  type TradingSalesOrder,
  type TradingCustomerOrder,
  type TradingDeliveryDispatch,
  type TradingSalesInvoice,
  type TradingSalesReturn,
  type TradingPurchaseReturn,
} from './trade-data';

const STORAGE_KEY = 'bisonstechs_trade_store_v3';

interface TradeStoreState {
  suppliers: TradeSupplier[];
  customers: TradeCustomer[];
  products: TradeProduct[];

  importRfqs: ImportRfq[];
  importPOs: ImportPurchaseOrder[];
  importPIs: ImportProformaInvoice[];
  importShipments: ImportShipment[];
  importCustoms: ImportCustomsClearance[];
  importDocs: ImportDocument[];
  importGrns: ImportGRN[];
  landedCosts: LandedCostAllocation[];
  importFinanceLCs: ImportFinanceLC[];
  importBills: ImportSupplierBill[];

  exportInquiries: ExportInquiry[];
  exportQuotations: ExportQuotation[];
  exportOrders: ExportSalesOrder[];
  exportPIs: ExportProformaInvoice[];
  exportPackings: ExportPackingAndInspection[];
  exportShipments: ExportShipment[];
  exportCustoms: ExportCustomsDeclaration[];
  exportDocs: ExportDocument[];
  exportDispatches: ExportDispatch[];
  exportFinanceLCs: ExportFinanceLC[];
  exportReceipts: ExportReceiptSettlement[];

  tradingStock: TradingStockOverviewItem[];
  tradingPriceLists: TradingPriceList[];
  tradingCustomerPricing: TradingCustomerPricing[];
  tradingMargins: TradingMarginAnalysis[];
  tradingPOs: TradingPurchaseOrder[];
  tradingSupplierQuotes: TradingSupplierQuote[];
  tradingGoodsReceiving: TradingGoodsReceiving[];
  tradingSalesQuotes: TradingSalesQuotation[];
  tradingSalesOrders: TradingSalesOrder[];
  tradingCustomerOrders: TradingCustomerOrder[];
  tradingDeliveries: TradingDeliveryDispatch[];
  tradingInvoices: TradingSalesInvoice[];
  tradingSalesReturns: TradingSalesReturn[];
  tradingPurchaseReturns: TradingPurchaseReturn[];
}

function getInitialState(): TradeStoreState {
  return {
    suppliers: TRADE_SUPPLIERS,
    customers: TRADE_CUSTOMERS,
    products: TRADE_PRODUCTS,

    importRfqs: INITIAL_IMPORT_RFQS,
    importPOs: INITIAL_IMPORT_POS,
    importPIs: INITIAL_IMPORT_PROFORMA_INVOICES,
    importShipments: INITIAL_IMPORT_SHIPMENTS,
    importCustoms: INITIAL_IMPORT_CUSTOMS,
    importDocs: INITIAL_IMPORT_DOCUMENTS,
    importGrns: INITIAL_IMPORT_GRNS,
    landedCosts: INITIAL_LANDED_COSTS,
    importFinanceLCs: INITIAL_IMPORT_FINANCE_LCS,
    importBills: INITIAL_IMPORT_BILLS,

    exportInquiries: INITIAL_EXPORT_INQUIRIES,
    exportQuotations: INITIAL_EXPORT_QUOTATIONS,
    exportOrders: INITIAL_EXPORT_ORDERS,
    exportPIs: INITIAL_EXPORT_PROFORMAS,
    exportPackings: INITIAL_EXPORT_PACKINGS,
    exportShipments: INITIAL_EXPORT_SHIPMENTS,
    exportCustoms: INITIAL_EXPORT_CUSTOMS,
    exportDocs: INITIAL_EXPORT_DOCUMENTS,
    exportDispatches: INITIAL_EXPORT_DISPATCHES,
    exportFinanceLCs: INITIAL_EXPORT_FINANCE_LCS,
    exportReceipts: INITIAL_EXPORT_RECEIPTS,

    tradingStock: INITIAL_TRADING_STOCK,
    tradingPriceLists: INITIAL_TRADING_PRICE_LISTS,
    tradingCustomerPricing: INITIAL_TRADING_CUSTOMER_PRICING,
    tradingMargins: INITIAL_TRADING_MARGINS,
    tradingPOs: INITIAL_TRADING_POS,
    tradingSupplierQuotes: INITIAL_TRADING_SUPPLIER_QUOTES,
    tradingGoodsReceiving: INITIAL_TRADING_GOODS_RECEIVING,
    tradingSalesQuotes: INITIAL_TRADING_SALES_QUOTATIONS,
    tradingSalesOrders: INITIAL_TRADING_SALES_ORDERS,
    tradingCustomerOrders: INITIAL_TRADING_CUSTOMER_ORDERS,
    tradingDeliveries: INITIAL_TRADING_DELIVERIES,
    tradingInvoices: INITIAL_TRADING_INVOICES,
    tradingSalesReturns: INITIAL_TRADING_SALES_RETURNS,
    tradingPurchaseReturns: INITIAL_TRADING_PURCHASE_RETURNS,
  };
}

let inMemoryState: TradeStoreState = getInitialState();
const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryState));
    } catch {
      // ignore quota errors
    }
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      inMemoryState = { ...getInitialState(), ...parsed };
    }
  } catch {
    // ignore
  }
}

export function useTradeStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const updateState = useCallback((updater: (state: TradeStoreState) => void) => {
    updater(inMemoryState);
    notify();
  }, []);

  const resetToDefault = useCallback(() => {
    inMemoryState = getInitialState();
    notify();
  }, []);

  // ── Trading Sales Orders ──────────────────────────────────────────────────
  const addTradingSalesOrder = useCallback((order: TradingSalesOrder) => {
    inMemoryState.tradingSalesOrders = [order, ...inMemoryState.tradingSalesOrders];
    notify();
  }, []);

  const updateTradingSalesOrderStatus = useCallback((id: string, status: TradingSalesOrder['status']) => {
    inMemoryState.tradingSalesOrders = inMemoryState.tradingSalesOrders.map((o) =>
      o.id === id ? { ...o, status } : o
    );
    notify();
  }, []);

  return {
    state: inMemoryState,
    updateState,
    resetToDefault,
    // Top-level convenience aliases (also available via state for backward compat)
    suppliers: TRADE_SUPPLIERS,
    customers: TRADE_CUSTOMERS,
    products: TRADE_PRODUCTS,
    // Action helpers
    addTradingSalesOrder,
    updateTradingSalesOrderStatus,
    // KPI helpers bound to current store state
    getTradingKpis: () => getTradingKpis(inMemoryState),
    getExportKpis: () => getExportKpis(inMemoryState),
    getImportKpis: () => getImportKpis(inMemoryState),
  };
}


// ----------------------------------------------------------------------------
// Analytical & KPI Derived Helpers (Internally Consistent Metrics)
// ----------------------------------------------------------------------------

export function getImportKpis(state: TradeStoreState) {
  const totalOrders = state.importPOs.length;
  const pendingShipments = state.importPOs.filter((p) =>
    ['Approved', 'Ordered'].includes(p.status)
  ).length;
  const inTransit = state.importShipments.filter(
    (s) => s.shipmentStatus === 'In Transit' || s.shipmentStatus === 'Sailed'
  ).length;
  const customsPending = state.importCustoms.filter(
    (c) => c.clearanceStatus !== 'Out of Charge' && c.clearanceStatus !== 'Cleared'
  ).length;
  const expectedArrivalsThisMonth = state.importPOs.filter((p) =>
    ['In Transit', 'Arrived'].includes(p.status)
  ).length;

  const totalImportValueUsd = state.importPOs.reduce(
    (acc, cur) => acc + (cur.status !== 'Cancelled' ? cur.totalUsd : 0),
    0
  );

  const outstandingSupplierPaymentsUsd = state.importBills.reduce(
    (acc, cur) => acc + cur.balanceUsd,
    0
  );

  const averageLandedCostExpensePct =
    state.landedCosts.length > 0
      ? state.landedCosts.reduce(
          (acc, cur) =>
            acc + (cur.totalLandedExpensesUsd / (cur.purchaseFobTotalUsd || 1)) * 100,
          0
        ) / state.landedCosts.length
      : 15.5;

  const pendingDocuments = state.importDocs.filter(
    (d) => d.status === 'Pending Review'
  ).length;

  return {
    totalOrders,
    pendingShipments,
    inTransit,
    customsPending,
    expectedArrivalsThisMonth,
    totalImportValueUsd,
    outstandingSupplierPaymentsUsd,
    averageLandedCostExpensePct,
    pendingDocuments,
  };
}

export function getExportKpis(state: TradeStoreState) {
  const totalOrders = state.exportOrders.length;
  const pendingShipments = state.exportOrders.filter((o) =>
    ['Confirmed', 'In Production / Packing', 'Pre-Shipment Inspection'].includes(
      o.status
    )
  ).length;
  const inTransit = state.exportShipments.filter(
    (s) => s.shipmentStatus === 'In Transit' || s.shipmentStatus === 'Loaded on Vessel'
  ).length;
  const customsPending = state.exportCustoms.filter(
    (c) => c.exportDeclarationStatus !== 'Let Export Order (LEO) Granted' && c.exportDeclarationStatus !== 'Sailed & Completed'
  ).length;
  const customsCleared = state.exportCustoms.filter(
    (c) => c.exportDeclarationStatus === 'Let Export Order (LEO) Granted' || c.exportDeclarationStatus === 'Sailed & Completed'
  ).length;

  // 1. Contracted Order Bookings (FOB/CIF total value of active confirmed contracts)
  const contractedExportOrderValueUsd = state.exportOrders.reduce(
    (acc, cur) => acc + (cur.status !== 'Cancelled' ? cur.totalOrderUsd : 0),
    0
  );

  // 2. Recognized Export Revenue (Goods dispatched / shipped / loaded on vessel with commercial invoice issued)
  const recognizedExportRevenueUsd = state.exportOrders
    .filter((o) => ['On Board Vessel', 'In Transit', 'Dispatched', 'Delivered', 'Completed'].includes(o.status))
    .reduce((acc, cur) => acc + cur.totalOrderUsd, 0);

  // 3. Unfulfilled Order Backlog (Confirmed orders still in packing, staging or pre-shipment inspection)
  const unfulfilledBacklogUsd = state.exportOrders
    .filter((o) => ['Confirmed', 'In Production / Packing', 'Pre-Shipment Inspection'].includes(o.status))
    .reduce((acc, cur) => acc + cur.totalOrderUsd, 0);

  // 4. Collected & Realized Receipts (net of bank charges after Nostro credit)
  const realizedReceiptsUsd = state.exportReceipts.reduce(
    (acc, cur) => acc + (cur.status === 'Realized & Credited' ? cur.netRealizedUsd : 0),
    0
  );
  const grossRemittanceUsd = state.exportReceipts.reduce(
    (acc, cur) => acc + (cur.status === 'Realized & Credited' ? cur.foreignAmount : 0),
    0
  );

  // 5. Invoiced Outstanding Receivables (shipped & invoiced orders minus allocated remittances)
  // ESO-2026-0029: Invoiced $84,000 - $25,200 received = $58,800 outstanding (CAD / Open Account - not LC backed)
  const outstandingInvoicedReceivablesUsd = state.exportOrders
    .filter((o) => ['On Board Vessel', 'In Transit', 'Dispatched', 'Delivered', 'Completed'].includes(o.status))
    .reduce((acc, cur) => acc + cur.outstandingBalanceUsd, 0);

  // 6. LC-Secured Future Receivables (unshipped orders fully backed by confirmed Irrevocable Letters of Credit)
  // ESO-2026-0033: $149,500 backed by Al Rajhi Bank LC-ADV-2026-0442
  const lcSecuredReceivablesUsd = state.exportFinanceLCs
    .filter((lc) => ['Confirmed', 'LC Advised'].includes(lc.status))
    .reduce((acc, cur) => acc + cur.lcValueUsd, 0);

  // Total pending settlement across invoiced + LC commitments
  const totalPendingSettlementUsd = outstandingInvoicedReceivablesUsd + lcSecuredReceivablesUsd;

  const totalExportRevenueUsd = contractedExportOrderValueUsd; // Backward compat for legacy references
  const outstandingReceivablesUsd = outstandingInvoicedReceivablesUsd; // True A/R on recognized shipments

  const pendingExportDocuments = state.exportDocs.filter(
    (d) => d.status === 'Draft' || d.status === 'Finalized'
  ).length;
  const legalizedOrDispatchedDocuments = state.exportDocs.filter(
    (d) =>
      d.status === 'Legalized / Attested' ||
      d.status === 'Dispatched via DHL to Bank'
  ).length;

  const totalExportDocuments = state.exportDocs.length;
  const upcomingDispatches = state.exportDispatches.length;
  const shipmentCount = state.exportShipments.length;

  // LC cover only on contracted value that is explicitly LC-backed in finance records
  const lcCoverPct =
    contractedExportOrderValueUsd > 0
      ? Math.min(100, (lcSecuredReceivablesUsd / contractedExportOrderValueUsd) * 100)
      : 0;

  return {
    totalOrders,
    pendingShipments,
    inTransit,
    customsPending,
    customsCleared,
    contractedExportOrderValueUsd,
    recognizedExportRevenueUsd,
    unfulfilledBacklogUsd,
    realizedReceiptsUsd,
    grossRemittanceUsd,
    outstandingInvoicedReceivablesUsd,
    lcSecuredReceivablesUsd,
    lcCoverPct,
    totalPendingSettlementUsd,
    totalExportRevenueUsd,
    outstandingReceivablesUsd,
    pendingExportDocuments,
    legalizedOrDispatchedDocuments,
    totalExportDocuments,
    upcomingDispatches,
    shipmentCount,
  };
}

export function getTradingKpis(state: TradeStoreState) {
  const totalTradingSalesUsd = state.tradingSalesOrders.reduce(
    (acc, cur) => acc + (cur.status !== 'Cancelled' ? cur.totalAmountUsd : 0),
    0
  );

  const totalTradingPurchasesUsd = state.tradingPOs.reduce(
    (acc, cur) => acc + (cur.status !== 'Cancelled' ? cur.totalUsd : 0),
    0
  );

  const grossTradingProfitUsd = state.tradingSalesOrders.reduce(
    (acc, cur) => acc + (cur.status !== 'Cancelled' ? cur.grossProfitUsd : 0),
    0
  );

  const grossMarginPercentage =
    totalTradingSalesUsd > 0
      ? (grossTradingProfitUsd / totalTradingSalesUsd) * 100
      : 22.9;

  const currentTradingStockValueUsd = state.tradingStock.reduce(
    (acc, cur) => acc + cur.totalValuationUsd,
    0
  );

  const openSalesOrders = state.tradingSalesOrders.filter((o) =>
    ['Confirmed', 'Allocated', 'Partially Dispatched'].includes(o.status)
  ).length;

  const pendingPurchaseOrders = state.tradingPOs.filter((p) =>
    ['Draft', 'Sent', 'Confirmed'].includes(p.status)
  ).length;

  const outstandingReceivablesUsd = state.tradingInvoices.reduce(
    (acc, cur) => acc + (cur.status !== 'Paid' ? cur.balanceUsd : 0),
    0
  );

  // Open PO commitments (not yet Received & Invoiced) — not the same as AP ledger bills
  const openPurchaseCommitmentsUsd = state.tradingPOs
    .filter((p) => ['Draft', 'Sent', 'Confirmed', 'Partially Received'].includes(p.status))
    .reduce((acc, p) => acc + p.totalUsd, 0);
  const outstandingPayablesUsd = openPurchaseCommitmentsUsd;

  const lowStockItemsCount = state.tradingStock.filter(
    (item) => item.availableQty <= item.reorderPoint
  ).length;

  return {
    totalTradingSalesUsd,
    totalTradingPurchasesUsd,
    grossTradingProfitUsd,
    grossMarginPercentage,
    currentTradingStockValueUsd,
    openSalesOrders,
    pendingPurchaseOrders,
    outstandingReceivablesUsd,
    outstandingPayablesUsd,
    openPurchaseCommitmentsUsd,
    lowStockItemsCount,
  };
}
