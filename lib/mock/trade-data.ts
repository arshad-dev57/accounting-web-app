// ============================================================================
// Bisonstechs ERP — Shared Realistic Mock Dataset for Import, Export & Trading
// Frontend mock book only (localStorage). Module ownership:
//   Export  → overseas buyers / ESO-* / ESHP-* / EREC-* (Al-Noor, SingaTrade, …)
//   Trading → domestic/local wholesale / TSO-* / TPO-* (Emirates, Al-Maktoum, …)
//   Import  → inbound IPO-* / ISHP-* / LCA-* (links to Purchases for postings)
// Do not sum Trading + Export as company-wide revenue — separate books.
// ============================================================================

export type CurrencyCode = 'USD' | 'EUR' | 'AED' | 'GBP' | 'CNY' | 'JPY' | 'SAR';
export type Incoterm = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DDP' | 'CIP' | 'FCA';

// ----------------------------------------------------------------------------
// Shared Master Entities (Referencing existing ERP concepts)
// ----------------------------------------------------------------------------

export interface TradeSupplier {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  currency: CurrencyCode;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number; // 1-5
  paymentTerms: string;
}

export interface TradeCustomer {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  currency: CurrencyCode;
  contactPerson: string;
  email: string;
  phone: string;
  creditLimit: number;
  paymentTerms: string;
  tier: 'Distributor' | 'Wholesale Tier 1' | 'Key Account' | 'Spot Trader';
}

export interface TradeProduct {
  id: string;
  sku: string;
  name: string;
  category: 'Industrial Machinery' | 'Raw Materials' | 'Consumer Electronics' | 'Chemicals & Polymers' | 'Automotive Spares';
  uom: 'PCS' | 'MT' | 'SETS' | 'KG' | 'DRUMS' | 'BOXES';
  hsCode: string;
  originCountry: string;
  standardCostUsd: number;
  standardSellUsd: number;
  currentStock: number;
  allocatedStock: number;
  reorderLevel: number;
  leadTimeDays: number;
}

export const TRADE_SUPPLIERS: TradeSupplier[] = [
  { id: 'sup-1', code: 'SUP-CN-01', name: 'Shanghai Heavy Industries Ltd', country: 'China', city: 'Shanghai', currency: 'USD', contactPerson: 'Zhang Wei', email: 'orders@shanghaiheavy.cn', phone: '+86 21 5888 1234', rating: 4.8, paymentTerms: '30% Advance, 70% LC at Sight' },
  { id: 'sup-2', code: 'SUP-DE-02', name: 'EuroPrecision Maschinenbau GmbH', country: 'Germany', city: 'Stuttgart', currency: 'EUR', contactPerson: 'Klaus Fischer', email: 'exports@europrecision.de', phone: '+49 711 942 5500', rating: 4.9, paymentTerms: 'Net 45 Days Wire' },
  { id: 'sup-3', code: 'SUP-JP-03', name: 'Tokyo Micro-Automation Corp', country: 'Japan', city: 'Yokohama', currency: 'USD', contactPerson: 'Kenji Sato', email: 'trade@tokyo-automation.jp', phone: '+81 45 671 8890', rating: 4.7, paymentTerms: 'Confirmed Irrevocable LC' },
  { id: 'sup-4', code: 'SUP-IN-04', name: 'Bharat Alloys & Forgings Pvt Ltd', country: 'India', city: 'Mumbai', currency: 'USD', contactPerson: 'Arun Patel', email: 'sales@bharatalloys.in', phone: '+91 22 2490 1122', rating: 4.5, paymentTerms: 'CAD (Cash Against Documents)' },
  { id: 'sup-5', code: 'SUP-AE-05', name: 'Gulf Petrochem Distribution FZE', country: 'United Arab Emirates', city: 'Dubai', currency: 'AED', contactPerson: 'Rashid Al-Maktoum', email: 'supply@gulfpetrochem.ae', phone: '+971 4 881 2200', rating: 4.6, paymentTerms: 'Net 30 Days' },
];

export const TRADE_CUSTOMERS: TradeCustomer[] = [
  { id: 'cust-1', code: 'CUST-SA-01', name: 'Al-Noor Industrial Trading Co', country: 'Saudi Arabia', city: 'Riyadh', currency: 'USD', contactPerson: 'Fahad Al-Otaibi', email: 'procurement@alnoor-sa.com', phone: '+966 11 478 9900', creditLimit: 250000, paymentTerms: 'LC at 60 Days Usance', tier: 'Distributor' },
  { id: 'cust-2', code: 'CUST-AU-02', name: 'Pacific Mining & Engineering Pty', country: 'Australia', city: 'Perth', currency: 'USD', contactPerson: 'Liam Hemsworth', email: 'supplychain@pacificmining.au', phone: '+61 8 9222 3400', creditLimit: 500000, paymentTerms: '30% Advance, 70% against BL copy', tier: 'Key Account' },
  { id: 'cust-3', code: 'CUST-GB-03', name: 'Caledonian Logistics & Trade Ltd', country: 'United Kingdom', city: 'Glasgow', currency: 'GBP', contactPerson: 'Oliver Smith', email: 'purchasing@caledoniantrade.co.uk', phone: '+44 141 552 8900', creditLimit: 180000, paymentTerms: 'Net 30 Days Wire', tier: 'Wholesale Tier 1' },
  { id: 'cust-4', code: 'CUST-EG-04', name: 'Nile Delta Contracting & Supplies', country: 'Egypt', city: 'Cairo', currency: 'USD', contactPerson: 'Mahmoud Hassan', email: 'imports@niledelta.eg', phone: '+20 2 2795 4321', creditLimit: 120000, paymentTerms: 'Irrevocable LC at Sight', tier: 'Wholesale Tier 1' },
  { id: 'cust-5', code: 'CUST-AE-05', name: 'Emirates Commercial Wholesale LLC', country: 'United Arab Emirates', city: 'Dubai', currency: 'AED', contactPerson: 'Tariq Mansoori', email: 'orders@emirateswholesale.ae', phone: '+971 4 333 7788', creditLimit: 300000, paymentTerms: 'PDC 45 Days', tier: 'Distributor' },
  { id: 'cust-6', code: 'CUST-SG-06', name: 'SingaTrade Global Logistics Pte', country: 'Singapore', city: 'Singapore', currency: 'USD', contactPerson: 'Eileen Tan', email: 'procurement@singatrade.sg', phone: '+65 6745 1199', creditLimit: 350000, paymentTerms: 'Net 30 Days', tier: 'Spot Trader' },
  // Domestic / local wholesale (Trading module ownership — not used as Export contracted buyers)
  { id: 'cust-7', code: 'CUST-AE-07', name: 'Al-Maktoum Industrial Supplies LLC', country: 'United Arab Emirates', city: 'Sharjah', currency: 'AED', contactPerson: 'Layla Al-Hashimi', email: 'orders@almaktoum-supplies.ae', phone: '+971 6 554 2200', creditLimit: 200000, paymentTerms: 'PDC 30 Days', tier: 'Wholesale Tier 1' },
];

export const TRADE_PRODUCTS: TradeProduct[] = [
  { id: 'prod-1', sku: 'PRD-MCH-001', name: 'CNC 5-Axis Milling Spindle Motor 15kW', category: 'Industrial Machinery', uom: 'SETS', hsCode: '8466.93.90', originCountry: 'Germany', standardCostUsd: 4200, standardSellUsd: 5850, currentStock: 14, allocatedStock: 6, reorderLevel: 5, leadTimeDays: 28 },
  { id: 'prod-2', sku: 'PRD-STL-002', name: 'Cold Rolled Stainless Steel Coil 304 Grade', category: 'Raw Materials', uom: 'MT', hsCode: '7219.34.00', originCountry: 'China', standardCostUsd: 1850, standardSellUsd: 2320, currentStock: 82, allocatedStock: 35, reorderLevel: 25, leadTimeDays: 35 },
  { id: 'prod-3', sku: 'PRD-HYD-003', name: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', category: 'Industrial Machinery', uom: 'PCS', hsCode: '8413.60.20', originCountry: 'Japan', standardCostUsd: 1250, standardSellUsd: 1780, currentStock: 48, allocatedStock: 12, reorderLevel: 15, leadTimeDays: 21 },
  { id: 'prod-4', sku: 'PRD-CHM-004', name: 'Industrial Polyethylene Resin Granules HDPE-5502', category: 'Chemicals & Polymers', uom: 'MT', hsCode: '3901.20.00', originCountry: 'United Arab Emirates', standardCostUsd: 980, standardSellUsd: 1260, currentStock: 160, allocatedStock: 45, reorderLevel: 50, leadTimeDays: 10 },
  { id: 'prod-5', sku: 'PRD-ELC-005', name: 'Solid State Industrial Frequency Converter 75kW', category: 'Consumer Electronics', uom: 'PCS', hsCode: '8504.40.90', originCountry: 'Germany', standardCostUsd: 2600, standardSellUsd: 3650, currentStock: 22, allocatedStock: 8, reorderLevel: 8, leadTimeDays: 30 },
  { id: 'prod-6', sku: 'PRD-AUT-006', name: 'Heavy Commercial Vehicle Disc Brake Assemblies', category: 'Automotive Spares', uom: 'BOXES', hsCode: '8708.30.50', originCountry: 'India', standardCostUsd: 340, standardSellUsd: 495, currentStock: 95, allocatedStock: 30, reorderLevel: 40, leadTimeDays: 18 },
];

export const TRADE_PORTS = [
  { code: 'AEJEA', name: 'Jebel Ali Port', country: 'United Arab Emirates', type: 'Sea Port' },
  { code: 'CNSHA', name: 'Port of Shanghai', country: 'China', type: 'Sea Port' },
  { code: 'DEHAM', name: 'Hamburg Port', country: 'Germany', type: 'Sea Port' },
  { code: 'JPTYO', name: 'Port of Tokyo', country: 'Japan', type: 'Sea Port' },
  { code: 'SGSIN', name: 'Port of Singapore', country: 'Singapore', type: 'Sea Port' },
  { code: 'SARUH', name: 'Riyadh Dry Port', country: 'Saudi Arabia', type: 'Dry Port' },
  { code: 'DXBAIR', name: 'Dubai International Cargo Terminal (DXB)', country: 'United Arab Emirates', type: 'Air Cargo' },
];

// ============================================================================
// 1. IMPORT MANAGEMENT DATA
// ============================================================================

export interface ImportRfq {
  id: string;
  rfqNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  incoterm: Incoterm;
  currency: CurrencyCode;
  portOfDischarge: string;
  expectedDelivery: string;
  status: 'Draft' | 'Sent to Supplier' | 'Quotation Received' | 'Approved' | 'PO Created' | 'Cancelled';
  totalEstimatedUsd: number;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    hsCode: string;
    quantity: number;
    uom: string;
    targetPriceUsd: number;
    quotedPriceUsd?: number;
  }>;
  notes: string;
}

export interface ImportPurchaseOrder {
  id: string;
  poNumber: string;
  rfqRef?: string;
  piRef?: string;
  orderDate: string;
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  incoterm: Incoterm;
  currency: CurrencyCode;
  exchangeRateToUsd: number;
  subtotalForeign: number;
  totalUsd: number;
  paymentTerms: string;
  portOfLoading: string;
  portOfEntry: string;
  estimatedArrival: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'In Transit' | 'Arrived' | 'Partially Received' | 'Received' | 'Costed' | 'Completed' | 'Cancelled';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export interface ImportProformaInvoice {
  id: string;
  piNumber: string;
  poRef: string;
  supplierName: string;
  issueDate: string;
  validUntil: string;
  currency: CurrencyCode;
  amountForeign: number;
  amountUsd: number;
  advanceRequiredPercent: number;
  advanceAmountUsd: number;
  lcRequired: boolean;
  lcNumber?: string;
  bankSwift: string;
  status: 'Received' | 'Accepted' | 'Advance Paid' | 'LC Issued' | 'Rejected';
}

export interface ImportShipment {
  id: string;
  shipmentNumber: string;
  poRef: string;
  supplierName: string;
  carrier: string;
  blNumber: string;
  originPort: string;
  portOfEntry: string;
  vesselFlight: string;
  etd: string;
  eta: string;
  containerNo: string;
  containerType: '20ft FCL' | '40ft HC' | 'LCL Consolidation' | 'Air Cargo Unit';
  grossWeightKg: number;
  cbm: number;
  shipmentStatus: 'Booking Confirmed' | 'Sailed' | 'In Transit' | 'Arrived at Port' | 'Under Clearance' | 'Cleared & Dispatched';
  currentMilestone: string;
  milestones: Array<{ title: string; date: string; completed: boolean }>;
}

export interface ImportCustomsClearance {
  id: string;
  entryNumber: string;
  billOfEntryNo: string;
  poRef: string;
  shipmentRef: string;
  portOfEntry: string;
  declarationDate: string;
  customsBroker: string;
  cifValueUsd: number;
  customsDutyRatePct: number;
  customsDutyUsd: number;
  importVatUsd: number;
  portHandlingChargesUsd: number;
  inspectionFeeUsd: number;
  totalCustomsPayableUsd: number;
  clearanceStatus: 'Under Assessment' | 'Duty Assessment Done' | 'Duty Paid' | 'Physical Inspection' | 'Cleared' | 'Out of Charge';
  dutyPaymentRef?: string;
}

export interface ImportDocument {
  id: string;
  docNumber: string;
  docType: 'Bill of Lading' | 'Commercial Invoice' | 'Packing List' | 'Certificate of Origin' | 'Insurance Certificate' | 'Inspection Certificate' | 'Bill of Entry';
  poRef: string;
  shipmentRef: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  originalReceived: boolean;
  status: 'Verified' | 'Pending Review' | 'Discrepancy Noted' | 'Archived';
  filePlaceholder: string;
}

export interface ImportGRN {
  id: string;
  grnNumber: string;
  poRef: string;
  shipmentRef: string;
  warehouseName: string;
  receiptDate: string;
  containerNo: string;
  sealIntact: boolean;
  receivedBy: string;
  status: 'Inspected & Received' | 'Partial Receipt' | 'Damaged Reported';
  items: Array<{
    productId: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    uom: string;
    lotNumber: string;
  }>;
}

export interface LandedCostAllocation {
  id: string;
  allocationNumber: string;
  poRef: string;
  shipmentRef: string;
  grnRef: string;
  date: string;
  purchaseFobTotalUsd: number;
  oceanFreightUsd: number;
  customsDutyUsd: number;
  marineInsuranceUsd: number;
  portDemurrageAndHandlingUsd: number;
  clearingAgencyChargesUsd: number;
  inlandTransportationUsd: number;
  totalLandedExpensesUsd: number;
  totalFinalLandedCostUsd: number;
  allocationMethod: 'By Item Value' | 'By Weight / Volume' | 'Equal Split';
  status: 'Draft' | 'Allocated' | 'Allocated (mock — post in Purchases/Warehouse)';
  items: Array<{
    productId: string;
    productName: string;
    qty: number;
    unitFobUsd: number;
    allocatedExpensePerUnitUsd: number;
    finalLandedCostPerUnitUsd: number;
    originalCostVariancePct: number;
  }>;
}

export interface ImportFinanceLC {
  id: string;
  lcNumber: string;
  poRef: string;
  piRef: string;
  lcType: 'Irrevocable Confirmed Sight LC' | 'Usance LC 60 Days' | 'Revolving LC' | 'Transferable LC';
  issuingBank: string;
  advisingBank: string;
  beneficiary: string;
  lcAmount: number;
  currency: CurrencyCode;
  issuanceDate: string;
  expiryDate: string;
  latestShipmentDate: string;
  marginPercent: number;
  cashMarginBlockedUsd: number;
  bankChargesUsd: number;
  status: 'Application Submitted' | 'LC Issued' | 'Documents Received' | 'Documents Accepted' | 'Matured & Settled' | 'Cancelled';
}

export interface ImportSupplierBill {
  id: string;
  billNumber: string;
  poRef: string;
  supplierName: string;
  billDate: string;
  dueDate: string;
  currency: CurrencyCode;
  totalAmountForeign: number;
  totalAmountUsd: number;
  paidAmountUsd: number;
  balanceUsd: number;
  paymentTerms: string;
  status: 'Pending Approval' | 'Approved' | 'Partially Paid' | 'Paid';
  linkedPurchaseBillUrl: string; // Navigates to /purchases/invoices
}

// Initial Mock Datasets for Import
export const INITIAL_IMPORT_RFQS: ImportRfq[] = [
  {
    id: 'irfq-101',
    rfqNumber: 'IRFQ-2026-089',
    date: '2026-09-15',
    supplierId: 'sup-1',
    supplierName: 'Shanghai Heavy Industries Ltd',
    supplierCountry: 'China',
    incoterm: 'CIF',
    currency: 'USD',
    portOfDischarge: 'Jebel Ali Port (AEJEA)',
    expectedDelivery: '2026-11-20',
    status: 'PO Created',
    totalEstimatedUsd: 116000,
    items: [
      { productId: 'prod-2', productName: 'Cold Rolled Stainless Steel Coil 304 Grade', sku: 'PRD-STL-002', hsCode: '7219.34.00', quantity: 50, uom: 'MT', targetPriceUsd: 1800, quotedPriceUsd: 1850 },
      { productId: 'prod-4', productName: 'Industrial Polyethylene Resin Granules HDPE-5502', sku: 'PRD-CHM-004', hsCode: '3901.20.00', quantity: 24, uom: 'MT', targetPriceUsd: 950, quotedPriceUsd: 980 }
    ],
    notes: 'Bulk order quotation for Q4 inventory replenishment. Certificate of Analysis required.'
  },
  {
    id: 'irfq-102',
    rfqNumber: 'IRFQ-2026-090',
    date: '2026-09-28',
    supplierId: 'sup-2',
    supplierName: 'EuroPrecision Maschinenbau GmbH',
    supplierCountry: 'Germany',
    incoterm: 'CIP',
    currency: 'EUR',
    portOfDischarge: 'Dubai International Cargo Terminal (DXB)',
    expectedDelivery: '2026-11-05',
    status: 'Quotation Received',
    totalEstimatedUsd: 58800,
    items: [
      { productId: 'prod-1', productName: 'CNC 5-Axis Milling Spindle Motor 15kW', sku: 'PRD-MCH-001', hsCode: '8466.93.90', quantity: 10, uom: 'SETS', targetPriceUsd: 4000, quotedPriceUsd: 4200 },
      { productId: 'prod-5', productName: 'Solid State Industrial Frequency Converter 75kW', sku: 'PRD-ELC-005', hsCode: '8504.40.90', quantity: 4, uom: 'PCS', targetPriceUsd: 2500, quotedPriceUsd: 2600 }
    ],
    notes: 'Urgent air freight components for high-precision CNC refurbishing line.'
  },
  {
    id: 'irfq-103',
    rfqNumber: 'IRFQ-2026-091',
    date: '2026-10-02',
    supplierId: 'sup-3',
    supplierName: 'Tokyo Micro-Automation Corp',
    supplierCountry: 'Japan',
    incoterm: 'FOB',
    currency: 'USD',
    portOfDischarge: 'Jebel Ali Port (AEJEA)',
    expectedDelivery: '2026-12-10',
    status: 'Sent to Supplier',
    totalEstimatedUsd: 37500,
    items: [
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', sku: 'PRD-HYD-003', hsCode: '8413.60.20', quantity: 30, uom: 'PCS', targetPriceUsd: 1200, quotedPriceUsd: 1250 }
    ],
    notes: 'Inquiry for high-pressure pumps. Requesting FOB Tokyo pricing and container packing list.'
  }
];

export const INITIAL_IMPORT_POS: ImportPurchaseOrder[] = [
  {
    id: 'ipo-201',
    poNumber: 'IPO-2026-0042',
    rfqRef: 'IRFQ-2026-089',
    piRef: 'PI-SHI-8841',
    orderDate: '2026-09-20',
    supplierId: 'sup-1',
    supplierName: 'Shanghai Heavy Industries Ltd',
    supplierCountry: 'China',
    incoterm: 'CIF',
    currency: 'USD',
    exchangeRateToUsd: 1.0,
    subtotalForeign: 116020,
    totalUsd: 116020,
    paymentTerms: '30% Advance, 70% LC at Sight',
    portOfLoading: 'Port of Shanghai (CNSHA)',
    portOfEntry: 'Jebel Ali Port (AEJEA)',
    estimatedArrival: '2026-10-28',
    status: 'In Transit',
    items: [
      { productId: 'prod-2', productName: 'Cold Rolled Stainless Steel Coil 304 Grade', sku: 'PRD-STL-002', quantity: 50, uom: 'MT', unitPrice: 1850, totalAmount: 92500 },
      { productId: 'prod-4', productName: 'Industrial Polyethylene Resin Granules HDPE-5502', sku: 'PRD-CHM-004', quantity: 24, uom: 'MT', unitPrice: 980, totalAmount: 23520 }
    ]
  },
  {
    id: 'ipo-202',
    poNumber: 'IPO-2026-0039',
    rfqRef: 'IRFQ-2026-074',
    piRef: 'PI-EPM-5519',
    orderDate: '2026-08-14',
    supplierId: 'sup-2',
    supplierName: 'EuroPrecision Maschinenbau GmbH',
    supplierCountry: 'Germany',
    incoterm: 'CIP',
    currency: 'EUR',
    exchangeRateToUsd: 1.08,
    subtotalForeign: 54444,
    totalUsd: 58800,
    paymentTerms: 'Net 45 Days Wire',
    portOfLoading: 'Hamburg Port (DEHAM)',
    portOfEntry: 'Dubai International Cargo Terminal (DXB)',
    estimatedArrival: '2026-10-18',
    status: 'Arrived',
    items: [
      { productId: 'prod-1', productName: 'CNC 5-Axis Milling Spindle Motor 15kW', sku: 'PRD-MCH-001', quantity: 10, uom: 'SETS', unitPrice: 4200, totalAmount: 42000 },
      { productId: 'prod-5', productName: 'Solid State Industrial Frequency Converter 75kW', sku: 'PRD-ELC-005', quantity: 4, uom: 'PCS', unitPrice: 2600, totalAmount: 10400 }
    ]
  },
  {
    id: 'ipo-203',
    poNumber: 'IPO-2026-0035',
    rfqRef: 'IRFQ-2026-062',
    piRef: 'PI-BAF-1102',
    orderDate: '2026-07-10',
    supplierId: 'sup-4',
    supplierName: 'Bharat Alloys & Forgings Pvt Ltd',
    supplierCountry: 'India',
    incoterm: 'CFR',
    currency: 'USD',
    exchangeRateToUsd: 1.0,
    subtotalForeign: 34000,
    totalUsd: 34000,
    paymentTerms: 'CAD (Cash Against Documents)',
    portOfLoading: 'Nhava Sheva (INNSA)',
    portOfEntry: 'Jebel Ali Port (AEJEA)',
    estimatedArrival: '2026-08-05',
    status: 'Completed',
    items: [
      { productId: 'prod-6', productName: 'Heavy Commercial Vehicle Disc Brake Assemblies', sku: 'PRD-AUT-006', quantity: 100, uom: 'BOXES', unitPrice: 340, totalAmount: 34000 }
    ]
  }
];

export const INITIAL_IMPORT_PROFORMA_INVOICES: ImportProformaInvoice[] = [
  {
    id: 'ipi-301',
    piNumber: 'PI-SHI-8841',
    poRef: 'IPO-2026-0042',
    supplierName: 'Shanghai Heavy Industries Ltd',
    issueDate: '2026-09-18',
    validUntil: '2026-10-18',
    currency: 'USD',
    amountForeign: 116020,
    amountUsd: 116020,
    advanceRequiredPercent: 30,
    advanceAmountUsd: 34806,
    lcRequired: true,
    lcNumber: 'LC-DXB-2026-0994',
    bankSwift: 'BKCHCNBJ110',
    status: 'LC Issued'
  },
  {
    id: 'ipi-302',
    piNumber: 'PI-EPM-5519',
    poRef: 'IPO-2026-0039',
    supplierName: 'EuroPrecision Maschinenbau GmbH',
    issueDate: '2026-08-10',
    validUntil: '2026-09-15',
    currency: 'EUR',
    amountForeign: 54444,
    amountUsd: 58800,
    advanceRequiredPercent: 0,
    advanceAmountUsd: 0,
    lcRequired: false,
    bankSwift: 'DBEUST33',
    status: 'Accepted'
  }
];

export const INITIAL_IMPORT_SHIPMENTS: ImportShipment[] = [
  {
    id: 'ishp-401',
    shipmentNumber: 'ISHP-2026-0182',
    poRef: 'IPO-2026-0042',
    supplierName: 'Shanghai Heavy Industries Ltd',
    carrier: 'COSCO Shipping Lines',
    blNumber: 'COSU632899120',
    originPort: 'Port of Shanghai (CNSHA)',
    portOfEntry: 'Jebel Ali Port (AEJEA)',
    vesselFlight: 'COSCO Pride V.042W',
    etd: '2026-10-02',
    eta: '2026-10-28',
    containerNo: 'TGHU9231450',
    containerType: '40ft HC',
    grossWeightKg: 74200,
    cbm: 58.4,
    shipmentStatus: 'In Transit',
    currentMilestone: 'Vessel transiting Arabian Sea toward Strait of Hormuz',
    milestones: [
      { title: 'Factory Dispatch & Container Stuffing', date: '2026-09-29', completed: true },
      { title: 'Customs Clearance at Origin (Shanghai)', date: '2026-10-01', completed: true },
      { title: 'Vessel Departure (CNSHA)', date: '2026-10-02', completed: true },
      { title: 'Transshipment Hub (Singapore)', date: '2026-10-14', completed: true },
      { title: 'Expected Jebel Ali Port Berth', date: '2026-10-28', completed: false },
      { title: 'Customs Clearance & Gate-Out', date: '2026-10-30', completed: false }
    ]
  },
  {
    id: 'ishp-402',
    shipmentNumber: 'ISHP-2026-0179',
    poRef: 'IPO-2026-0039',
    supplierName: 'EuroPrecision Maschinenbau GmbH',
    carrier: 'Emirates SkyCargo',
    blNumber: '176-92837160',
    originPort: 'Frankfurt Airport (FRA)',
    portOfEntry: 'Dubai International Cargo Terminal (DXB)',
    vesselFlight: 'EK 046 Cargo',
    etd: '2026-10-16',
    eta: '2026-10-18',
    containerNo: 'PMC-29188-EK',
    containerType: 'Air Cargo Unit',
    grossWeightKg: 3120,
    cbm: 14.2,
    shipmentStatus: 'Arrived at Port',
    currentMilestone: 'Discharged at DXB Cargo Mega Terminal; Awaiting customs clearance',
    milestones: [
      { title: 'Airway Bill Generated', date: '2026-10-15', completed: true },
      { title: 'Flight Departed Frankfurt', date: '2026-10-16', completed: true },
      { title: 'Cargo Touchdown DXB', date: '2026-10-17', completed: true },
      { title: 'Awaiting Bill of Entry Submission', date: '2026-10-18', completed: false }
    ]
  }
];

export const INITIAL_IMPORT_CUSTOMS: ImportCustomsClearance[] = [
  {
    id: 'icust-501',
    entryNumber: 'CUST-BOE-2026-44120',
    billOfEntryNo: 'BOE-DXB-998124',
    poRef: 'IPO-2026-0039',
    shipmentRef: 'ISHP-2026-0179',
    portOfEntry: 'Dubai International Cargo Terminal (DXB)',
    declarationDate: '2026-10-18',
    customsBroker: 'Al-Futtaim Logistics Customs Brokerage',
    cifValueUsd: 58800,
    customsDutyRatePct: 5.0,
    customsDutyUsd: 2940,
    importVatUsd: 3087,
    portHandlingChargesUsd: 680,
    inspectionFeeUsd: 250,
    totalCustomsPayableUsd: 6957,
    clearanceStatus: 'Duty Assessment Done',
    dutyPaymentRef: 'EPAY-CD-884920'
  },
  {
    id: 'icust-502',
    entryNumber: 'CUST-BOE-2026-38102',
    billOfEntryNo: 'BOE-JEA-771290',
    poRef: 'IPO-2026-0035',
    shipmentRef: 'ISHP-2026-0160',
    portOfEntry: 'Jebel Ali Port (AEJEA)',
    declarationDate: '2026-08-03',
    customsBroker: 'Apex Freight Solutions FZCO',
    cifValueUsd: 34000,
    customsDutyRatePct: 5.0,
    customsDutyUsd: 1700,
    importVatUsd: 1785,
    portHandlingChargesUsd: 520,
    inspectionFeeUsd: 150,
    totalCustomsPayableUsd: 4155,
    clearanceStatus: 'Out of Charge',
    dutyPaymentRef: 'EPAY-CD-772183'
  }
];

export const INITIAL_IMPORT_DOCUMENTS: ImportDocument[] = [
  { id: 'idoc-1', docNumber: 'COSU632899120', docType: 'Bill of Lading', poRef: 'IPO-2026-0042', shipmentRef: 'ISHP-2026-0182', issuer: 'COSCO Shipping', issueDate: '2026-10-02', originalReceived: true, status: 'Verified', filePlaceholder: 'COSU_BL_Original_Signed.pdf' },
  { id: 'idoc-2', docNumber: 'INV-SHI-2026-90', docType: 'Commercial Invoice', poRef: 'IPO-2026-0042', shipmentRef: 'ISHP-2026-0182', issuer: 'Shanghai Heavy Industries', issueDate: '2026-09-28', originalReceived: true, status: 'Verified', filePlaceholder: 'Commercial_Invoice_90.pdf' },
  { id: 'idoc-3', docNumber: 'PL-SHI-2026-90', docType: 'Packing List', poRef: 'IPO-2026-0042', shipmentRef: 'ISHP-2026-0182', issuer: 'Shanghai Heavy Industries', issueDate: '2026-09-28', originalReceived: true, status: 'Verified', filePlaceholder: 'Packing_List_Detailed.pdf' },
  { id: 'idoc-4', docNumber: 'CCPIT-COO-77192', docType: 'Certificate of Origin', poRef: 'IPO-2026-0042', shipmentRef: 'ISHP-2026-0182', issuer: 'China Council for Promotion of Int Trade (CCPIT)', issueDate: '2026-10-01', originalReceived: true, status: 'Verified', filePlaceholder: 'Certificate_Of_Origin_China.pdf' },
  { id: 'idoc-5', docNumber: 'AWB-176-92837160', docType: 'Bill of Lading', poRef: 'IPO-2026-0039', shipmentRef: 'ISHP-2026-0179', issuer: 'Emirates SkyCargo', issueDate: '2026-10-15', originalReceived: false, status: 'Pending Review', filePlaceholder: 'AirwayBill_EK176.pdf' },
  { id: 'idoc-6', docNumber: 'EUR1-DE-44120', docType: 'Certificate of Origin', poRef: 'IPO-2026-0039', shipmentRef: 'ISHP-2026-0179', issuer: 'IHK Stuttgart Chamber', issueDate: '2026-10-12', originalReceived: true, status: 'Verified', filePlaceholder: 'EUR1_Movement_Cert.pdf' }
];

export const INITIAL_IMPORT_GRNS: ImportGRN[] = [
  {
    id: 'igrn-601',
    grnNumber: 'IGRN-2026-0034',
    poRef: 'IPO-2026-0035',
    shipmentRef: 'ISHP-2026-0160',
    warehouseName: 'Port Jebel Ali Free Zone Warehouse',
    receiptDate: '2026-08-06',
    containerNo: 'MSKU8819203',
    sealIntact: true,
    receivedBy: 'Farooq Siddiqui (Warehouse Supervisor)',
    status: 'Inspected & Received',
    items: [
      { productId: 'prod-6', productName: 'Heavy Commercial Vehicle Disc Brake Assemblies', orderedQty: 100, receivedQty: 100, acceptedQty: 100, rejectedQty: 0, uom: 'BOXES', lotNumber: 'LOT-IN-2026-B9' }
    ]
  }
];

export const INITIAL_LANDED_COSTS: LandedCostAllocation[] = [
  {
    id: 'ilc-701',
    allocationNumber: 'LCA-2026-0021',
    poRef: 'IPO-2026-0035',
    shipmentRef: 'ISHP-2026-0160',
    grnRef: 'IGRN-2026-0034',
    date: '2026-08-08',
    purchaseFobTotalUsd: 34000,
    oceanFreightUsd: 2400,
    customsDutyUsd: 1700,
    marineInsuranceUsd: 320,
    portDemurrageAndHandlingUsd: 520,
    clearingAgencyChargesUsd: 450,
    inlandTransportationUsd: 650,
    totalLandedExpensesUsd: 6040,
    totalFinalLandedCostUsd: 40040,
    allocationMethod: 'By Item Value',
    status: 'Allocated (mock — post in Purchases/Warehouse)',
    items: [
      {
        productId: 'prod-6',
        productName: 'Heavy Commercial Vehicle Disc Brake Assemblies',
        qty: 100,
        unitFobUsd: 340,
        allocatedExpensePerUnitUsd: 60.40,
        finalLandedCostPerUnitUsd: 400.40,
        originalCostVariancePct: 17.76
      }
    ]
  }
];

export const INITIAL_IMPORT_FINANCE_LCS: ImportFinanceLC[] = [
  {
    id: 'ilc-801',
    lcNumber: 'LC-DXB-2026-0994',
    poRef: 'IPO-2026-0042',
    piRef: 'PI-SHI-8841',
    lcType: 'Irrevocable Confirmed Sight LC',
    issuingBank: 'Emirates NBD Corporate Banking',
    advisingBank: 'Bank of China Shanghai Branch',
    beneficiary: 'Shanghai Heavy Industries Ltd',
    lcAmount: 81214,
    currency: 'USD',
    issuanceDate: '2026-09-25',
    expiryDate: '2026-11-30',
    latestShipmentDate: '2026-10-15',
    marginPercent: 20,
    cashMarginBlockedUsd: 16242.80,
    bankChargesUsd: 750,
    status: 'LC Issued'
  }
];

export const INITIAL_IMPORT_BILLS: ImportSupplierBill[] = [
  {
    id: 'ibill-901',
    billNumber: 'BILL-IMP-2026-051',
    poRef: 'IPO-2026-0042',
    supplierName: 'Shanghai Heavy Industries Ltd',
    billDate: '2026-09-22',
    dueDate: '2026-10-22',
    currency: 'USD',
    totalAmountForeign: 34806,
    totalAmountUsd: 34806,
    paidAmountUsd: 34806,
    balanceUsd: 0,
    paymentTerms: '30% Advance Wire',
    status: 'Paid',
    linkedPurchaseBillUrl: '/purchases/invoices'
  },
  {
    id: 'ibill-902',
    billNumber: 'BILL-IMP-2026-055',
    poRef: 'IPO-2026-0039',
    supplierName: 'EuroPrecision Maschinenbau GmbH',
    billDate: '2026-10-16',
    dueDate: '2026-11-30',
    currency: 'EUR',
    totalAmountForeign: 54444,
    totalAmountUsd: 58800,
    paidAmountUsd: 0,
    balanceUsd: 58800,
    paymentTerms: 'Net 45 Days Wire',
    status: 'Approved',
    linkedPurchaseBillUrl: '/purchases/invoices'
  }
];

// ============================================================================
// 2. EXPORT MANAGEMENT DATA
// ============================================================================

export interface ExportInquiry {
  id: string;
  inquiryNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerCountry: string;
  targetDestinationPort: string;
  incoterm: Incoterm;
  currency: CurrencyCode;
  targetDispatchDate: string;
  leadStage: 'New Inquiry' | 'Technical Review' | 'Quoted' | 'Negotiation' | 'Order Won' | 'Lost';
  estimatedRevenueUsd: number;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    requestedQty: number;
    uom: string;
    targetPriceUsd: number;
  }>;
  notes: string;
}

export interface ExportQuotation {
  id: string;
  quoteNumber: string;
  inquiryRef: string;
  quoteDate: string;
  validUntil: string;
  customerName: string;
  customerCountry: string;
  incoterm: Incoterm;
  currency: CurrencyCode;
  portOfLoading: string;
  portOfDischarge: string;
  subtotalUsd: number;
  freightEstimateUsd: number;
  insuranceEstimateUsd: number;
  totalQuoteUsd: number;
  paymentTerms: string;
  status: 'Draft' | 'Sent to Buyer' | 'Under Negotiation' | 'Accepted' | 'Declined' | 'Converted to Order';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    uom: string;
    unitPriceUsd: number;
    totalAmountUsd: number;
  }>;
}

export interface ExportSalesOrder {
  id: string;
  orderNumber: string;
  quoteRef?: string;
  inquiryRef?: string;
  customerName: string;
  customerCountry: string;
  destinationPort: string;
  incoterm: Incoterm;
  currency: CurrencyCode;
  orderDate: string;
  deliveryDeadline: string;
  subtotalUsd: number;
  freightAndChargesUsd: number;
  totalOrderUsd: number;
  advanceReceivedUsd: number;
  outstandingBalanceUsd: number;
  paymentTerms: string;
  status: 'Confirmed' | 'In Production / Packing' | 'Pre-Shipment Inspection' | 'Customs Cleared' | 'Dispatched' | 'On Board Vessel' | 'Delivered' | 'Completed' | 'Cancelled';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    uom: string;
    unitPriceUsd: number;
    totalAmountUsd: number;
  }>;
}

export interface ExportProformaInvoice {
  id: string;
  piNumber: string;
  orderRef: string;
  customerName: string;
  customerCountry: string;
  date: string;
  currency: CurrencyCode;
  amountForeign: number;
  amountUsd: number;
  bankSwiftCode: string;
  beneficiaryAccount: string;
  lcNumber?: string;
  status: 'Issued' | 'LC Advised' | 'Advance Remittance Received' | 'Final Settled';
}

export interface ExportPackingAndInspection {
  id: string;
  packingListNo: string;
  orderRef: string;
  customerName: string;
  packingDate: string;
  containerNo: string;
  sealNo: string;
  containerType: '20ft FCL' | '40ft HC' | 'LCL' | 'Air Pallet';
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalCbm: number;
  packagesCount: number;
  inspectionAgency: 'SGS International' | 'Bureau Veritas' | 'TUV Rheinland' | 'Internal QA';
  inspectionCertificateNo: string;
  inspectionStatus: 'Inspection Scheduled' | 'Sample Tested' | 'Passed & Certified' | 'Rejection / Re-pack';
}

export interface ExportShipment {
  id: string;
  shipmentNumber: string;
  orderRef: string;
  customerName: string;
  customerCountry: string;
  shippingLine: string;
  bookingRef: string;
  blNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  vesselName: string;
  etd: string;
  eta: string;
  shipmentStatus: 'Booking Confirmed' | 'Container Gate-In' | 'Loaded on Vessel' | 'In Transit' | 'Arrived at Destination' | 'Customs Cleared Buyer';
  currentPosition: string;
}

export interface ExportCustomsDeclaration {
  id: string;
  shippingBillNo: string;
  orderRef: string;
  exportPort: string;
  declarationDate: string;
  fobValueUsd: number;
  customsAgent: string;
  dutyDrawbackEligible: boolean;
  dutyDrawbackEstimatedUsd: number;
  exportDeclarationStatus: 'Draft' | 'Submitted to Customs' | 'Goods Inspected at Port' | 'Let Export Order (LEO) Granted' | 'Sailed & Completed';
  leoDate?: string;
}

export interface ExportDocument {
  id: string;
  docNumber: string;
  docType: 'Commercial Invoice' | 'Packing List' | 'Certificate of Origin (Chamber)' | 'Bill of Lading' | 'Shipping Bill' | 'Insurance Certificate' | 'Inspection Certificate';
  orderRef: string;
  customerName: string;
  issueDate: string;
  status: 'Draft' | 'Finalized' | 'Legalized / Attested' | 'Dispatched via DHL to Bank' | 'Delivered to Buyer';
  courierTrackingNo?: string;
  filePlaceholder: string;
}

export interface ExportDispatch {
  id: string;
  dispatchNumber: string;
  orderRef: string;
  dispatchDate: string;
  transporterName: string;
  truckNo: string;
  driverName: string;
  driverPhone: string;
  destinationPort: string;
  sealNo: string;
  gatePassNo: string;
  status: 'Staged at Warehouse' | 'En Route to Port' | 'Container Gate-In Complete' | 'Handed Over to Shipping Line';
}

export interface ExportFinanceLC {
  id: string;
  lcAdviceNumber: string;
  orderRef: string;
  issuingBank: string;
  advisingBank: string;
  applicant: string;
  lcValueUsd: number;
  currency: CurrencyCode;
  expiryDate: string;
  latestShipmentDate: string;
  presentationDays: number;
  discrepancyStatus: 'Clean Documents' | 'Discrepancy Waived' | 'Pending Review';
  status: 'LC Advised' | 'Confirmed' | 'Documents Negotiated' | 'Settlement Received';
}

export interface ExportReceiptSettlement {
  id: string;
  receiptNumber: string;
  orderRef: string;
  customerName: string;
  customerCountry: string;
  settlementDate: string;
  remittanceCurrency: CurrencyCode;
  foreignAmount: number;
  exchangeRate: number;
  netRealizedUsd: number;
  bankChargesUsd: number;
  nostroAccountRef: string;
  status: 'Funds In Transit' | 'Realized & Credited' | 'Forex Hedged';
  linkedSalesPaymentUrl: string; // Navigates to /sales/sales-payment
}

// Initial Mock Datasets for Export
export const INITIAL_EXPORT_INQUIRIES: ExportInquiry[] = [
  {
    id: 'eirq-101',
    inquiryNumber: 'EINQ-2026-0054',
    date: '2026-09-22',
    customerId: 'cust-1',
    customerName: 'Al-Noor Industrial Trading Co',
    customerCountry: 'Saudi Arabia',
    targetDestinationPort: 'Riyadh Dry Port (SARUH)',
    incoterm: 'DDP',
    currency: 'USD',
    targetDispatchDate: '2026-11-15',
    leadStage: 'Order Won',
    estimatedRevenueUsd: 145000,
    items: [
      { productId: 'prod-4', productName: 'Industrial Polyethylene Resin Granules HDPE-5502', sku: 'PRD-CHM-004', requestedQty: 80, uom: 'MT', targetPriceUsd: 1250 },
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', sku: 'PRD-HYD-003', requestedQty: 25, uom: 'PCS', targetPriceUsd: 1750 }
    ],
    notes: 'Urgent inquiry for ongoing petrochemical maintenance plant in Jubail. Saudi SASO Saber compliance certificate mandatory.'
  },
  {
    id: 'eirq-102',
    inquiryNumber: 'EINQ-2026-0058',
    date: '2026-10-04',
    customerId: 'cust-2',
    customerName: 'Pacific Mining & Engineering Pty',
    customerCountry: 'Australia',
    targetDestinationPort: 'Fremantle Port, Perth',
    incoterm: 'CIF',
    currency: 'USD',
    targetDispatchDate: '2026-12-01',
    leadStage: 'Quoted',
    estimatedRevenueUsd: 87750,
    items: [
      { productId: 'prod-1', productName: 'CNC 5-Axis Milling Spindle Motor 15kW', sku: 'PRD-MCH-001', requestedQty: 15, uom: 'SETS', targetPriceUsd: 5850 }
    ],
    notes: 'Inquiry for heavy duty mining milling spindles. Requires sea-worthy wooden crating and ISPM-15 phytosanitary stamp.'
  },
  {
    id: 'eirq-103',
    inquiryNumber: 'EINQ-2026-0061',
    date: '2026-10-11',
    customerId: 'cust-3',
    customerName: 'Caledonian Logistics & Trade Ltd',
    customerCountry: 'United Kingdom',
    targetDestinationPort: 'Southampton Container Port',
    incoterm: 'FOB',
    currency: 'GBP',
    targetDispatchDate: '2026-12-20',
    leadStage: 'Technical Review',
    estimatedRevenueUsd: 65000,
    items: [
      { productId: 'prod-6', productName: 'Heavy Commercial Vehicle Disc Brake Assemblies', sku: 'PRD-AUT-006', requestedQty: 120, uom: 'BOXES', targetPriceUsd: 495 }
    ],
    notes: 'UK fleet distributor looking for ongoing supply. Technical drawing and ECE R90 homologation cert submitted.'
  }
];

export const INITIAL_EXPORT_QUOTATIONS: ExportQuotation[] = [
  {
    id: 'eqt-201',
    quoteNumber: 'EQT-2026-0078',
    inquiryRef: 'EINQ-2026-0054',
    quoteDate: '2026-09-24',
    validUntil: '2026-10-24',
    customerName: 'Al-Noor Industrial Trading Co',
    customerCountry: 'Saudi Arabia',
    incoterm: 'DDP',
    currency: 'USD',
    portOfLoading: 'Jebel Ali Port (AEJEA)',
    portOfDischarge: 'Riyadh Dry Port (SARUH)',
    subtotalUsd: 144500,
    freightEstimateUsd: 4200,
    insuranceEstimateUsd: 800,
    totalQuoteUsd: 149500,
    paymentTerms: 'LC at 60 Days Usance',
    status: 'Converted to Order',
    items: [
      { productId: 'prod-4', productName: 'Industrial Polyethylene Resin Granules HDPE-5502', sku: 'PRD-CHM-004', quantity: 80, uom: 'MT', unitPriceUsd: 1260, totalAmountUsd: 100800 },
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', sku: 'PRD-HYD-003', quantity: 25, uom: 'PCS', unitPriceUsd: 1748, totalAmountUsd: 43700 }
    ]
  },
  {
    id: 'eqt-202',
    quoteNumber: 'EQT-2026-0082',
    inquiryRef: 'EINQ-2026-0058',
    quoteDate: '2026-10-06',
    validUntil: '2026-11-06',
    customerName: 'Pacific Mining & Engineering Pty',
    customerCountry: 'Australia',
    incoterm: 'CIF',
    currency: 'USD',
    portOfLoading: 'Jebel Ali Port (AEJEA)',
    portOfDischarge: 'Fremantle Port (AUFRE)',
    subtotalUsd: 87750,
    freightEstimateUsd: 3100,
    insuranceEstimateUsd: 650,
    totalQuoteUsd: 91500,
    paymentTerms: '30% Advance, 70% against BL copy',
    status: 'Sent to Buyer',
    items: [
      { productId: 'prod-1', productName: 'CNC 5-Axis Milling Spindle Motor 15kW', sku: 'PRD-MCH-001', quantity: 15, uom: 'SETS', unitPriceUsd: 5850, totalAmountUsd: 87750 }
    ]
  }
];

export const INITIAL_EXPORT_ORDERS: ExportSalesOrder[] = [
  {
    id: 'eso-301',
    orderNumber: 'ESO-2026-0033',
    quoteRef: 'EQT-2026-0078',
    inquiryRef: 'EINQ-2026-0054',
    customerName: 'Al-Noor Industrial Trading Co',
    customerCountry: 'Saudi Arabia',
    destinationPort: 'Riyadh Dry Port (SARUH)',
    incoterm: 'DDP',
    currency: 'USD',
    orderDate: '2026-09-28',
    deliveryDeadline: '2026-11-15',
    subtotalUsd: 144500,
    freightAndChargesUsd: 5000,
    totalOrderUsd: 149500,
    advanceReceivedUsd: 0,
    outstandingBalanceUsd: 149500,
    paymentTerms: 'LC at 60 Days Usance',
    status: 'In Production / Packing',
    items: [
      { productId: 'prod-4', productName: 'Industrial Polyethylene Resin Granules HDPE-5502', sku: 'PRD-CHM-004', quantity: 80, uom: 'MT', unitPriceUsd: 1260, totalAmountUsd: 100800 },
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', sku: 'PRD-HYD-003', quantity: 25, uom: 'PCS', unitPriceUsd: 1748, totalAmountUsd: 43700 }
    ]
  },
  {
    id: 'eso-302',
    orderNumber: 'ESO-2026-0029',
    quoteRef: 'EQT-2026-0062',
    inquiryRef: 'EINQ-2026-0041',
    customerName: 'SingaTrade Global Logistics Pte',
    customerCountry: 'Singapore',
    destinationPort: 'Port of Singapore (SGSIN)',
    incoterm: 'CIF',
    currency: 'USD',
    orderDate: '2026-08-18',
    deliveryDeadline: '2026-10-25',
    subtotalUsd: 81200,
    freightAndChargesUsd: 2800,
    totalOrderUsd: 84000,
    advanceReceivedUsd: 25200,
    outstandingBalanceUsd: 58800,
    paymentTerms: '30% Advance, 70% against BL',
    status: 'On Board Vessel',
    items: [
      { productId: 'prod-2', productName: 'Cold Rolled Stainless Steel Coil 304 Grade', sku: 'PRD-STL-002', quantity: 35, uom: 'MT', unitPriceUsd: 2320, totalAmountUsd: 81200 }
    ]
  }
];

export const INITIAL_EXPORT_PROFORMAS: ExportProformaInvoice[] = [
  {
    id: 'epi-401',
    piNumber: 'EPI-2026-0033',
    orderRef: 'ESO-2026-0033',
    customerName: 'Al-Noor Industrial Trading Co',
    customerCountry: 'Saudi Arabia',
    date: '2026-09-29',
    currency: 'USD',
    amountForeign: 149500,
    amountUsd: 149500,
    bankSwiftCode: 'EBBKAEADXXX',
    beneficiaryAccount: 'AED-IBAN-9928172901',
    lcNumber: 'ILC-SA-982103',
    status: 'LC Advised'
  },
  {
    id: 'epi-402',
    piNumber: 'EPI-2026-0029',
    orderRef: 'ESO-2026-0029',
    customerName: 'SingaTrade Global Logistics Pte',
    customerCountry: 'Singapore',
    date: '2026-08-20',
    currency: 'USD',
    amountForeign: 84000,
    amountUsd: 84000,
    bankSwiftCode: 'EBBKAEADXXX',
    beneficiaryAccount: 'USD-IBAN-8819203912',
    status: 'Advance Remittance Received'
  }
];

export const INITIAL_EXPORT_PACKINGS: ExportPackingAndInspection[] = [
  {
    id: 'epack-501',
    packingListNo: 'EPL-2026-0033',
    orderRef: 'ESO-2026-0033',
    customerName: 'Al-Noor Industrial Trading Co',
    packingDate: '2026-10-12',
    containerNo: 'CMAU7719280',
    sealNo: 'SEAL-DXB-99182',
    containerType: '40ft HC',
    totalGrossWeightKg: 82400,
    totalNetWeightKg: 80600,
    totalCbm: 64.0,
    packagesCount: 105,
    inspectionAgency: 'SGS International',
    inspectionCertificateNo: 'SGS-CERT-AE-8819',
    inspectionStatus: 'Passed & Certified'
  }
];

export const INITIAL_EXPORT_SHIPMENTS: ExportShipment[] = [
  {
    id: 'eshp-601',
    shipmentNumber: 'ESHP-2026-0091',
    orderRef: 'ESO-2026-0029',
    customerName: 'SingaTrade Global Logistics Pte',
    customerCountry: 'Singapore',
    shippingLine: 'Maersk Line A/S',
    bookingRef: 'MAE-DXB-991829',
    blNumber: 'MAEU982104921',
    portOfLoading: 'Jebel Ali Port (AEJEA)',
    portOfDischarge: 'Port of Singapore (SGSIN)',
    vesselName: 'Maersk Mc-Kinney Moller V.2608',
    etd: '2026-10-08',
    eta: '2026-10-24',
    shipmentStatus: 'In Transit',
    currentPosition: 'Malacca Strait transit underway; Scheduled arrival Oct 24'
  }
];

export const INITIAL_EXPORT_CUSTOMS: ExportCustomsDeclaration[] = [
  {
    id: 'ecust-701',
    shippingBillNo: 'EXP-SB-2026-9921',
    orderRef: 'ESO-2026-0029',
    exportPort: 'Jebel Ali Port (AEJEA)',
    declarationDate: '2026-10-05',
    fobValueUsd: 81200,
    customsAgent: 'Dubai World Central Forwarding LLC',
    dutyDrawbackEligible: true,
    dutyDrawbackEstimatedUsd: 2436,
    exportDeclarationStatus: 'Let Export Order (LEO) Granted',
    leoDate: '2026-10-07'
  }
];

export const INITIAL_EXPORT_DOCUMENTS: ExportDocument[] = [
  { id: 'edoc-1', docNumber: 'CI-EXP-2026-033', docType: 'Commercial Invoice', orderRef: 'ESO-2026-0033', customerName: 'Al-Noor Industrial Trading Co', issueDate: '2026-10-14', status: 'Legalized / Attested', filePlaceholder: 'Chamber_Attested_CI.pdf' },
  { id: 'edoc-2', docNumber: 'EPL-2026-0033', docType: 'Packing List', orderRef: 'ESO-2026-0033', customerName: 'Al-Noor Industrial Trading Co', issueDate: '2026-10-14', status: 'Finalized', filePlaceholder: 'Export_Packing_List_Detailed.pdf' },
  { id: 'edoc-3', docNumber: 'DXB-COO-2026-8812', docType: 'Certificate of Origin (Chamber)', orderRef: 'ESO-2026-0033', customerName: 'Al-Noor Industrial Trading Co', issueDate: '2026-10-15', status: 'Legalized / Attested', filePlaceholder: 'Dubai_Chamber_Origin_Cert.pdf' },
  { id: 'edoc-4', docNumber: 'MAEU982104921', docType: 'Bill of Lading', orderRef: 'ESO-2026-0029', customerName: 'SingaTrade Global Logistics Pte', issueDate: '2026-10-09', status: 'Dispatched via DHL to Bank', courierTrackingNo: 'DHL-8829102931', filePlaceholder: 'Original_Maersk_BL.pdf' }
];

export const INITIAL_EXPORT_DISPATCHES: ExportDispatch[] = [
  {
    id: 'edisp-801',
    dispatchNumber: 'EDISP-2026-0044',
    orderRef: 'ESO-2026-0029',
    dispatchDate: '2026-10-06',
    transporterName: 'Al-Futtaim Heavy Haulage',
    truckNo: 'DXB-Trailer-99218',
    driverName: 'Sultan Khan',
    driverPhone: '+971 50 491 8820',
    destinationPort: 'Jebel Ali Port Container Terminal 2',
    sealNo: 'SEAL-MAE-99821',
    gatePassNo: 'GP-JAFZA-88102',
    status: 'Handed Over to Shipping Line'
  }
];

export const INITIAL_EXPORT_FINANCE_LCS: ExportFinanceLC[] = [
  {
    id: 'efin-901',
    lcAdviceNumber: 'LC-ADV-2026-0442',
    orderRef: 'ESO-2026-0033',
    issuingBank: 'Al Rajhi Bank Corporate Branch, Riyadh',
    advisingBank: 'Emirates NBD International Trade Dept',
    applicant: 'Al-Noor Industrial Trading Co',
    lcValueUsd: 149500,
    currency: 'USD',
    expiryDate: '2026-12-15',
    latestShipmentDate: '2026-11-20',
    presentationDays: 21,
    discrepancyStatus: 'Clean Documents',
    status: 'Confirmed'
  }
];

export const INITIAL_EXPORT_RECEIPTS: ExportReceiptSettlement[] = [
  {
    id: 'erec-1001',
    receiptNumber: 'EREC-2026-0019',
    orderRef: 'ESO-2026-0029',
    customerName: 'SingaTrade Global Logistics Pte',
    customerCountry: 'Singapore',
    settlementDate: '2026-08-25',
    remittanceCurrency: 'USD',
    foreignAmount: 25200,
    exchangeRate: 1.0,
    netRealizedUsd: 25165,
    bankChargesUsd: 35,
    nostroAccountRef: 'NOSTRO-USD-ENBD-7719',
    status: 'Realized & Credited',
    linkedSalesPaymentUrl: '/sales/sales-payment'
  }
];

// ============================================================================
// 3. TRADING MANAGEMENT DATA
// ============================================================================

export interface TradingStockOverviewItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  warehouseName: string;
  onHandQty: number;
  allocatedQty: number;
  availableQty: number;
  reorderPoint: number;
  unitCostUsd: number;
  standardSellingUsd: number;
  totalValuationUsd: number;
  stockStatus: 'Optimal' | 'Low Stock' | 'Critical Shortage' | 'Overstocked';
}

export interface TradingPriceList {
  id: string;
  code: string;
  name: string;
  tier: 'Distributor' | 'Wholesale Tier 1' | 'Key Account' | 'Retail & Spot';
  currency: CurrencyCode;
  discountPercentage: number;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  itemCount: number;
}

export interface TradingCustomerPricing {
  id: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  productId: string;
  productName: string;
  sku: string;
  listPriceUsd: number;
  negotiatedPriceUsd: number;
  marginPct: number;
  minOrderQty: number;
  effectiveUntil: string;
  status: 'Active' | 'Under Review' | 'Expired';
}

export interface TradingMarginAnalysis {
  productId: string;
  sku: string;
  name: string;
  category: string;
  avgPurchaseCostUsd: number;
  avgSellingPriceUsd: number;
  grossMarginUsd: number;
  grossMarginPct: number;
  targetMarginPct: number;
  variancePct: number;
  marginStatus: 'Healthy' | 'Acceptable' | 'Below Target';
}

export interface TradingPurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  supplierCountry: string;
  procurementType: 'Stock Replenishment' | 'Back-to-Back Customer Order' | 'Drop-Shipment';
  linkedSalesOrderRef?: string;
  totalUsd: number;
  paymentTerms: string;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Partially Received' | 'Received & Invoiced' | 'Cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export interface TradingSupplierQuote {
  id: string;
  quoteNumber: string;
  supplierName: string;
  date: string;
  validUntil: string;
  itemCount: number;
  totalValueUsd: number;
  leadTimeDays: number;
  rank: number;
  status: 'Active' | 'Accepted' | 'Declined';
}

export interface TradingGoodsReceiving {
  id: string;
  receiptNumber: string;
  poRef: string;
  supplierName: string;
  warehouseName: string;
  receiptDate: string;
  itemsReceivedCount: number;
  totalReceivedValueUsd: number;
  status: 'Received (mock view)' | 'Partial' | 'QC Inspection Hold';
}

export interface TradingSalesQuotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  date: string;
  validUntil: string;
  currency: CurrencyCode;
  totalCostUsd: number;
  totalSellingPriceUsd: number;
  projectedGrossProfitUsd: number;
  projectedGrossMarginPct: number;
  status: 'Draft' | 'Sent to Customer' | 'Negotiation' | 'Approved' | 'Converted to Order' | 'Expired';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    uom: string;
    unitCostUsd: number;
    unitPriceUsd: number;
    marginPct: number;
    totalAmountUsd: number;
  }>;
}

export interface TradingSalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  channel?: 'B2B Trade Portal' | 'Key Account Rep' | 'Direct Wholesale' | 'EDI Integration';
  externalOrderNo?: string;
  orderDate: string;
  deliveryDate: string;
  totalAmountUsd: number;
  totalCostUsd: number;
  grossProfitUsd: number;
  grossMarginPct: number;
  stockAllocated: boolean;
  status: 'Draft' | 'Confirmed' | 'Allocated' | 'Partially Dispatched' | 'Dispatched' | 'Invoiced' | 'Completed' | 'Cancelled';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    uom: string;
    unitPriceUsd: number;
    totalAmountUsd: number;
  }>;
}

export interface TradingCustomerOrder {
  id: string;
  externalOrderNo: string;
  channel: 'B2B Trade Portal' | 'Key Account Rep' | 'Email Contract';
  customerName: string;
  orderDate: string;
  orderValueUsd: number;
  itemsCount: number;
  fulfillmentStatus: 'Stock Allocated' | 'Pending Stock' | 'Ready for Dispatch';
}

export interface TradingDeliveryDispatch {
  id: string;
  dispatchNumber: string;
  orderRef: string;
  customerName: string;
  destinationAddress: string;
  dispatchDate: string;
  transporter: string;
  trackingNumber: string;
  totalPackages: number;
  status: 'Staged' | 'Out for Delivery' | 'Delivered' | 'Returned';
}

export interface TradingSalesInvoice {
  id: string;
  invoiceNumber: string;
  orderRef: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subtotalUsd: number;
  taxAmountUsd: number;
  totalAmountUsd: number;
  paidAmountUsd: number;
  balanceUsd: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';
  linkedSalesInvoiceUrl: string; // Navigates to /sales/invoices
}

export interface TradingSalesReturn {
  id: string;
  returnNumber: string;
  invoiceRef: string;
  customerName: string;
  returnDate: string;
  reason: 'Defective Product' | 'Wrong Specification' | 'Overstock Agreement' | 'Transit Damage';
  returnTotalUsd: number;
  restockedToInventory: boolean;
  status: 'Requested' | 'Inspected & Approved' | 'Credit Note Issued' | 'Rejected';
}

export interface TradingPurchaseReturn {
  id: string;
  debitNoteNumber: string;
  poRef: string;
  supplierName: string;
  returnDate: string;
  reason: 'Quality Non-Conformance' | 'Damaged in Shipment' | 'Shortage / Overbilled';
  returnTotalUsd: number;
  status: 'Draft' | 'Dispatched to Supplier' | 'Debit Note Acknowledged & Settled';
}

// Initial Mock Datasets for Trading
export const INITIAL_TRADING_STOCK: TradingStockOverviewItem[] = [
  {
    id: 'tstk-1',
    productId: 'prod-1',
    sku: 'PRD-MCH-001',
    name: 'CNC 5-Axis Milling Spindle Motor 15kW',
    category: 'Industrial Machinery',
    warehouseName: 'Port Jebel Ali Free Zone Warehouse',
    onHandQty: 14,
    allocatedQty: 6,
    availableQty: 8,
    reorderPoint: 5,
    unitCostUsd: 4200,
    standardSellingUsd: 5850,
    totalValuationUsd: 58800,
    stockStatus: 'Optimal'
  },
  {
    id: 'tstk-2',
    productId: 'prod-2',
    sku: 'PRD-STL-002',
    name: 'Cold Rolled Stainless Steel Coil 304 Grade',
    category: 'Raw Materials',
    warehouseName: 'Central Logistics Hub Dubai',
    onHandQty: 82,
    allocatedQty: 35,
    availableQty: 47,
    reorderPoint: 25,
    unitCostUsd: 1850,
    standardSellingUsd: 2320,
    totalValuationUsd: 151700,
    stockStatus: 'Optimal'
  },
  {
    id: 'tstk-3',
    productId: 'prod-3',
    sku: 'PRD-HYD-003',
    name: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar',
    category: 'Industrial Machinery',
    warehouseName: 'Port Jebel Ali Free Zone Warehouse',
    onHandQty: 48,
    allocatedQty: 12,
    availableQty: 36,
    reorderPoint: 15,
    unitCostUsd: 1250,
    standardSellingUsd: 1780,
    totalValuationUsd: 60000,
    stockStatus: 'Optimal'
  },
  {
    id: 'tstk-4',
    productId: 'prod-4',
    sku: 'PRD-CHM-004',
    name: 'Industrial Polyethylene Resin Granules HDPE-5502',
    category: 'Chemicals & Polymers',
    warehouseName: 'Central Logistics Hub Dubai',
    onHandQty: 160,
    allocatedQty: 45,
    availableQty: 115,
    reorderPoint: 50,
    unitCostUsd: 980,
    standardSellingUsd: 1260,
    totalValuationUsd: 156800,
    stockStatus: 'Optimal'
  },
  {
    id: 'tstk-5',
    productId: 'prod-5',
    sku: 'PRD-ELC-005',
    name: 'Solid State Industrial Frequency Converter 75kW',
    category: 'Consumer Electronics',
    warehouseName: 'Port Jebel Ali Free Zone Warehouse',
    onHandQty: 22,
    allocatedQty: 8,
    availableQty: 14,
    reorderPoint: 8,
    unitCostUsd: 2600,
    standardSellingUsd: 3650,
    totalValuationUsd: 57200,
    stockStatus: 'Optimal'
  },
  {
    id: 'tstk-6',
    productId: 'prod-6',
    sku: 'PRD-AUT-006',
    name: 'Heavy Commercial Vehicle Disc Brake Assemblies',
    category: 'Automotive Spares',
    warehouseName: 'Central Logistics Hub Dubai',
    onHandQty: 95,
    allocatedQty: 30,
    availableQty: 65,
    reorderPoint: 40,
    unitCostUsd: 340,
    standardSellingUsd: 495,
    totalValuationUsd: 32300,
    stockStatus: 'Optimal'
  }
];

export const INITIAL_TRADING_PRICE_LISTS: TradingPriceList[] = [
  { id: 'tpl-1', code: 'PL-DIST-2026', name: 'Master Distributor Price List', tier: 'Distributor', currency: 'USD', discountPercentage: 15.0, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', isActive: true, itemCount: 6 },
  { id: 'tpl-2', code: 'PL-WHSL-2026', name: 'Wholesale Standard Tier 1', tier: 'Wholesale Tier 1', currency: 'USD', discountPercentage: 10.0, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', isActive: true, itemCount: 6 },
  { id: 'tpl-3', code: 'PL-KEY-2026', name: 'Strategic Key Accounts Negotiated', tier: 'Key Account', currency: 'USD', discountPercentage: 12.5, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', isActive: true, itemCount: 6 },
  { id: 'tpl-4', code: 'PL-SPOT-2026', name: 'Spot Trading & Retail List', tier: 'Retail & Spot', currency: 'USD', discountPercentage: 0.0, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', isActive: true, itemCount: 6 }
];

export const INITIAL_TRADING_CUSTOMER_PRICING: TradingCustomerPricing[] = [
  { id: 'tcp-1', customerId: 'cust-5', customerName: 'Emirates Commercial Wholesale LLC', customerTier: 'Distributor', productId: 'prod-6', productName: 'Heavy Commercial Vehicle Disc Brake Assemblies', sku: 'PRD-AUT-006', listPriceUsd: 495, negotiatedPriceUsd: 460, marginPct: 26.09, minOrderQty: 25, effectiveUntil: '2026-12-31', status: 'Active' },
  { id: 'tcp-2', customerId: 'cust-7', customerName: 'Al-Maktoum Industrial Supplies LLC', customerTier: 'Wholesale Tier 1', productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', sku: 'PRD-HYD-003', listPriceUsd: 1780, negotiatedPriceUsd: 1780, marginPct: 29.78, minOrderQty: 10, effectiveUntil: '2026-12-31', status: 'Active' },
  { id: 'tcp-3', customerId: 'cust-5', customerName: 'Emirates Commercial Wholesale LLC', customerTier: 'Distributor', productId: 'prod-5', productName: 'Solid State Industrial Frequency Converter 75kW', sku: 'PRD-ELC-005', listPriceUsd: 3650, negotiatedPriceUsd: 3681.25, marginPct: 29.37, minOrderQty: 4, effectiveUntil: '2026-12-31', status: 'Active' }
];

export const INITIAL_TRADING_MARGINS: TradingMarginAnalysis[] = [
  { productId: 'prod-1', sku: 'PRD-MCH-001', name: 'CNC 5-Axis Milling Spindle Motor 15kW', category: 'Industrial Machinery', avgPurchaseCostUsd: 4200, avgSellingPriceUsd: 5850, grossMarginUsd: 1650, grossMarginPct: 28.2, targetMarginPct: 25.0, variancePct: 3.2, marginStatus: 'Healthy' },
  { productId: 'prod-2', sku: 'PRD-STL-002', name: 'Cold Rolled Stainless Steel Coil 304 Grade', category: 'Raw Materials', avgPurchaseCostUsd: 1850, avgSellingPriceUsd: 2320, grossMarginUsd: 470, grossMarginPct: 20.25, targetMarginPct: 20.0, variancePct: 0.25, marginStatus: 'Healthy' },
  { productId: 'prod-3', sku: 'PRD-HYD-003', name: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', category: 'Industrial Machinery', avgPurchaseCostUsd: 1250, avgSellingPriceUsd: 1780, grossMarginUsd: 530, grossMarginPct: 29.77, targetMarginPct: 28.0, variancePct: 1.77, marginStatus: 'Healthy' },
  { productId: 'prod-4', sku: 'PRD-CHM-004', name: 'Industrial Polyethylene Resin Granules HDPE-5502', category: 'Chemicals & Polymers', avgPurchaseCostUsd: 980, avgSellingPriceUsd: 1260, grossMarginUsd: 280, grossMarginPct: 22.22, targetMarginPct: 22.0, variancePct: 0.22, marginStatus: 'Healthy' },
  { productId: 'prod-5', sku: 'PRD-ELC-005', name: 'Solid State Industrial Frequency Converter 75kW', category: 'Consumer Electronics', avgPurchaseCostUsd: 2600, avgSellingPriceUsd: 3650, grossMarginUsd: 1050, grossMarginPct: 28.77, targetMarginPct: 30.0, variancePct: -1.23, marginStatus: 'Acceptable' },
  { productId: 'prod-6', sku: 'PRD-AUT-006', name: 'Heavy Commercial Vehicle Disc Brake Assemblies', category: 'Automotive Spares', avgPurchaseCostUsd: 340, avgSellingPriceUsd: 495, grossMarginUsd: 155, grossMarginPct: 31.31, targetMarginPct: 30.0, variancePct: 1.31, marginStatus: 'Healthy' }
];

export const INITIAL_TRADING_POS: TradingPurchaseOrder[] = [
  {
    id: 'tpo-1',
    poNumber: 'TPO-2026-0112',
    date: '2026-09-15',
    supplierName: 'Shanghai Heavy Industries Ltd',
    supplierCountry: 'China',
    procurementType: 'Stock Replenishment',
    totalUsd: 116020,
    paymentTerms: '30% Advance, 70% LC at Sight',
    status: 'Confirmed',
    items: [
      { productId: 'prod-2', productName: 'Cold Rolled Stainless Steel Coil 304 Grade', quantity: 50, uom: 'MT', unitPrice: 1850, totalAmount: 92500 },
      { productId: 'prod-4', productName: 'Industrial Polyethylene Resin Granules HDPE-5502', quantity: 24, uom: 'MT', unitPrice: 980, totalAmount: 23520 }
    ]
  },
  {
    id: 'tpo-2',
    poNumber: 'TPO-2026-0115',
    date: '2026-10-02',
    supplierName: 'Tokyo Micro-Automation Corp',
    supplierCountry: 'Japan',
    procurementType: 'Back-to-Back Customer Order',
    linkedSalesOrderRef: 'TSO-2026-0144',
    totalUsd: 37500,
    paymentTerms: 'Confirmed LC',
    status: 'Sent',
    items: [
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', quantity: 30, uom: 'PCS', unitPrice: 1250, totalAmount: 37500 }
    ]
  }
];

export const INITIAL_TRADING_SUPPLIER_QUOTES: TradingSupplierQuote[] = [
  { id: 'tsq-1', quoteNumber: 'TSQ-2026-0044', supplierName: 'Shanghai Heavy Industries Ltd', date: '2026-09-10', validUntil: '2026-10-30', itemCount: 2, totalValueUsd: 116020, leadTimeDays: 28, rank: 1, status: 'Accepted' },
  { id: 'tsq-2', quoteNumber: 'TSQ-2026-0048', supplierName: 'Tokyo Micro-Automation Corp', date: '2026-09-29', validUntil: '2026-11-15', itemCount: 1, totalValueUsd: 37500, leadTimeDays: 21, rank: 1, status: 'Active' },
  { id: 'tsq-3', quoteNumber: 'TSQ-2026-0051', supplierName: 'EuroPrecision Maschinenbau GmbH', date: '2026-10-05', validUntil: '2026-11-05', itemCount: 2, totalValueUsd: 58800, leadTimeDays: 14, rank: 2, status: 'Active' }
];

export const INITIAL_TRADING_GOODS_RECEIVING: TradingGoodsReceiving[] = [
  { id: 'tgr-1', receiptNumber: 'TGRN-2026-0091', poRef: 'TPO-2026-0098', supplierName: 'Bharat Alloys & Forgings Pvt Ltd', warehouseName: 'Central Logistics Hub Dubai', receiptDate: '2026-08-08', itemsReceivedCount: 1, totalReceivedValueUsd: 34000, status: 'Received (mock view)' }
];

// Domestic / local trading quotations only (Export overseas deals live under ESO-* / EQT-*)
export const INITIAL_TRADING_SALES_QUOTATIONS: TradingSalesQuotation[] = [
  {
    id: 'tsq-101',
    quoteNumber: 'TSQ-2026-0092',
    customerName: 'Emirates Commercial Wholesale LLC',
    date: '2026-10-08',
    validUntil: '2026-11-08',
    currency: 'USD',
    totalCostUsd: 38200,
    totalSellingPriceUsd: 52450,
    projectedGrossProfitUsd: 14250,
    projectedGrossMarginPct: 27.17,
    status: 'Converted to Order',
    items: [
      { productId: 'prod-6', productName: 'Heavy Commercial Vehicle Disc Brake Assemblies', quantity: 50, uom: 'BOXES', unitCostUsd: 340, unitPriceUsd: 460, marginPct: 26.09, totalAmountUsd: 23000 },
      { productId: 'prod-5', productName: 'Solid State Industrial Frequency Converter 75kW', quantity: 8, uom: 'PCS', unitCostUsd: 2600, unitPriceUsd: 3681.25, marginPct: 29.37, totalAmountUsd: 29450 }
    ]
  },
  {
    id: 'tsq-102',
    quoteNumber: 'TSQ-2026-0095',
    customerName: 'Al-Maktoum Industrial Supplies LLC',
    date: '2026-09-30',
    validUntil: '2026-10-30',
    currency: 'USD',
    totalCostUsd: 52750,
    totalSellingPriceUsd: 70400,
    projectedGrossProfitUsd: 17650,
    projectedGrossMarginPct: 25.07,
    status: 'Converted to Order',
    items: [
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', quantity: 20, uom: 'PCS', unitCostUsd: 1250, unitPriceUsd: 1780, marginPct: 29.78, totalAmountUsd: 35600 },
      { productId: 'prod-2', productName: 'Cold Rolled Stainless Steel Coil 304 Grade', quantity: 15, uom: 'MT', unitCostUsd: 1850, unitPriceUsd: 2320, marginPct: 20.26, totalAmountUsd: 34800 }
    ]
  }
];

// Domestic trading sales only — distinct IDs from Export ESO-* deals (Al-Noor / SingaTrade)
export const INITIAL_TRADING_SALES_ORDERS: TradingSalesOrder[] = [
  {
    id: 'tso-201',
    orderNumber: 'TSO-2026-0140',
    customerName: 'Emirates Commercial Wholesale LLC',
    channel: 'B2B Trade Portal',
    externalOrderNo: 'PO-EMIRATES-4410',
    orderDate: '2026-10-09',
    deliveryDate: '2026-10-28',
    totalAmountUsd: 52450,
    totalCostUsd: 38200,
    grossProfitUsd: 14250,
    grossMarginPct: 27.17,
    stockAllocated: true,
    status: 'Allocated',
    items: [
      { productId: 'prod-6', productName: 'Heavy Commercial Vehicle Disc Brake Assemblies', sku: 'PRD-AUT-006', quantity: 50, uom: 'BOXES', unitPriceUsd: 460, totalAmountUsd: 23000 },
      { productId: 'prod-5', productName: 'Solid State Industrial Frequency Converter 75kW', sku: 'PRD-ELC-005', quantity: 8, uom: 'PCS', unitPriceUsd: 3681.25, totalAmountUsd: 29450 }
    ]
  },
  {
    id: 'tso-202',
    orderNumber: 'TSO-2026-0144',
    customerName: 'Al-Maktoum Industrial Supplies LLC',
    channel: 'Direct Wholesale',
    externalOrderNo: 'PO-AMS-2201',
    orderDate: '2026-10-03',
    deliveryDate: '2026-10-18',
    totalAmountUsd: 70400,
    totalCostUsd: 52750,
    grossProfitUsd: 17650,
    grossMarginPct: 25.07,
    stockAllocated: true,
    status: 'Dispatched',
    items: [
      { productId: 'prod-3', productName: 'High-Pressure Heavy Duty Hydraulic Pump 350 Bar', sku: 'PRD-HYD-003', quantity: 20, uom: 'PCS', unitPriceUsd: 1780, totalAmountUsd: 35600 },
      { productId: 'prod-2', productName: 'Cold Rolled Stainless Steel Coil 304 Grade', sku: 'PRD-STL-002', quantity: 15, uom: 'MT', unitPriceUsd: 2320, totalAmountUsd: 34800 }
    ]
  }
];

export const INITIAL_TRADING_CUSTOMER_ORDERS: TradingCustomerOrder[] = [
  { id: 'tco-1', externalOrderNo: 'PO-EMIRATES-4410', channel: 'B2B Trade Portal', customerName: 'Emirates Commercial Wholesale LLC', orderDate: '2026-10-09', orderValueUsd: 52450, itemsCount: 2, fulfillmentStatus: 'Stock Allocated' },
  { id: 'tco-2', externalOrderNo: 'PO-AMS-2201', channel: 'Key Account Rep', customerName: 'Al-Maktoum Industrial Supplies LLC', orderDate: '2026-10-03', orderValueUsd: 70400, itemsCount: 2, fulfillmentStatus: 'Ready for Dispatch' }
];

export const INITIAL_TRADING_DELIVERIES: TradingDeliveryDispatch[] = [
  {
    id: 'tdel-1',
    dispatchNumber: 'TDEL-2026-0088',
    orderRef: 'TSO-2026-0144',
    customerName: 'Al-Maktoum Industrial Supplies LLC',
    destinationAddress: 'Industrial Area 6, Warehouse B12, Sharjah',
    dispatchDate: '2026-10-12',
    transporter: 'Emirates Road Freight LLC',
    trackingNumber: 'TRK-SHJ-441902',
    totalPackages: 35,
    status: 'Delivered'
  }
];

export const INITIAL_TRADING_INVOICES: TradingSalesInvoice[] = [
  {
    id: 'tinv-1',
    invoiceNumber: 'TINV-2026-0144',
    orderRef: 'TSO-2026-0144',
    customerName: 'Al-Maktoum Industrial Supplies LLC',
    invoiceDate: '2026-10-12',
    dueDate: '2026-11-11',
    subtotalUsd: 67047.62,
    taxAmountUsd: 3352.38,
    totalAmountUsd: 70400,
    paidAmountUsd: 20000,
    balanceUsd: 50400,
    status: 'Partially Paid',
    linkedSalesInvoiceUrl: '/sales/invoices'
  }
];

export const INITIAL_TRADING_SALES_RETURNS: TradingSalesReturn[] = [
  {
    id: 'tsret-1',
    returnNumber: 'TSR-2026-0008',
    invoiceRef: 'TINV-2026-0095',
    customerName: 'Emirates Commercial Wholesale LLC',
    returnDate: '2026-09-12',
    reason: 'Wrong Specification',
    returnTotalUsd: 4950,
    restockedToInventory: true,
    status: 'Credit Note Issued'
  }
];

export const INITIAL_TRADING_PURCHASE_RETURNS: TradingPurchaseReturn[] = [
  {
    id: 'tpret-1',
    debitNoteNumber: 'DN-TRD-2026-0012',
    poRef: 'TPO-2026-0098',
    supplierName: 'Bharat Alloys & Forgings Pvt Ltd',
    returnDate: '2026-08-10',
    reason: 'Damaged in Shipment',
    returnTotalUsd: 3400,
    status: 'Debit Note Acknowledged & Settled'
  }
];
