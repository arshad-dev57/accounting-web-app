// Shared types + formatting for the customer account (360) page and report.

export type CustomerAccountOrderItem = {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type CustomerAccountOrder = {
  id: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grandTotal: number;
  invoiced: number;
  paid: number;
  remaining: number;
  deliveryStatus: string;
  deliveryDate?: string | null;
  deliveryNumbers: string[];
  invoiceNumbers: string[];
  itemCount: number;
  items: CustomerAccountOrderItem[];
};

export type CustomerAccountDelivery = {
  id: string;
  deliveryNumber: string;
  salesOrderNumber: string;
  deliveryDate: string;
  deliveryStatus: string;
  deliveryPerson?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  orderedQuantity: number;
  deliveredQuantity: number;
  items: Array<{
    productName: string;
    sku: string;
    unit: string;
    orderedQuantity: number;
    deliveredQuantity: number;
    remainingQuantity: number;
  }>;
};

export type CustomerAccountInvoice = {
  id: string;
  invoiceNumber: string;
  orderNumber?: string | null;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  invoiceStatus: string;
  paymentStatus: string;
  isOverdue: boolean;
};

export type CustomerAccountPayment = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  status: string;
  bankAccountName?: string | null;
};

export type CustomerAccountCreditNote = {
  id: string;
  creditNumber: string;
  date: string;
  amount: number;
  remainingAmount: number;
  status: string;
  reason: string;
};

export type CustomerAccountLedgerLine = {
  date: string;
  documentNumber: string;
  documentType: string;
  description: string;
  dueDate?: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
  refId?: string;
};

export type CustomerAccountSummary = {
  openingBalance: number;
  totalInvoiced: number;
  totalReceived: number;
  totalCredits: number;
  closingBalance: number;
  totalOutstanding: number;
  overdueAmount: number;
  overdueInvoices: number;
  invoiceCount: number;
  periodInvoiceCount: number;
  paymentCount: number;
  creditNoteCount: number;
  creditLimit: number;
  availableCredit: number;
  ordersCount: number;
  ordersValue: number;
  ordersPaid: number;
  ordersRemaining: number;
  deliveredOrders: number;
  undeliveredOrders: number;
  deliveriesCount: number;
  openDeliveries: number;
};

export type CustomerAccountData = {
  customer: {
    id: string;
    customerNumber: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    companyName?: string | null;
    customerType?: string | null;
    taxId?: string | null;
    status?: string | null;
    territory?: string | null;
    address?: Record<string, unknown> | null;
    shippingAddress?: Record<string, unknown> | null;
    billingAddress?: Record<string, unknown> | null;
    notes?: string | null;
    creditLimit: number;
    creditTerms?: string | null;
    creditDays?: number | null;
    creditPolicy?: string | null;
    loyaltyPoints?: number | null;
    totalOrders?: number | null;
    totalSpent?: number | null;
    averageOrderValue?: number | null;
    outstandingBalance?: number | null;
    lastOrderDate?: string | null;
    salesperson?: { id: string; name: string; phone?: string | null } | null;
  };
  company: {
    id?: string | null;
    name: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
    currencyCode: string;
    currencySymbol: string;
  };
  period: { from: string | null; to: string | null };
  summary: CustomerAccountSummary;
  orders: CustomerAccountOrder[];
  deliveries: CustomerAccountDelivery[];
  invoices: CustomerAccountInvoice[];
  payments: CustomerAccountPayment[];
  creditNotes: CustomerAccountCreditNote[];
  ledger: CustomerAccountLedgerLine[];
  monthly: Array<{ month: string; invoiced: number; received: number; orders: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    totalQuantity: number;
    totalValue: number;
  }>;
};

export function money(value: number | null | undefined, symbol = 'Rs.'): string {
  const amount = Number(value) || 0;
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function plainMoney(value: number | null | undefined): string {
  return (Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function dateLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function periodText(period?: { from?: string | null; to?: string | null }): string {
  if (!period?.from && !period?.to) return 'All time';
  if (period.from && period.to) return `${dateLabel(period.from)} — ${dateLabel(period.to)}`;
  if (period.from) return `From ${dateLabel(period.from)}`;
  return `Up to ${dateLabel(period.to)}`;
}

export function addressText(address?: Record<string, unknown> | null): string {
  if (!address || typeof address !== 'object') return '';
  const pick = (key: string) => {
    const value = (address as Record<string, unknown>)[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  return [
    pick('street'),
    pick('addressLine1'),
    pick('city'),
    pick('state'),
    pick('postalCode'),
    pick('country'),
  ]
    .filter(Boolean)
    .join(', ');
}
