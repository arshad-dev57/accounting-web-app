export interface SalesInvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  orderNumber?: string;
  deliveryId?: string;
  deliveryNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress?: any;
  shippingAddress?: any;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  invoiceStatus: 'Draft' | 'Posted' | 'Partially Paid' | 'Paid' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  notes?: string;
  termsConditions?: string;
  postedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  salesRevenueAccountId?: string;
  arAccountId?: string;
  journalEntryId?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: SalesInvoiceItem[];
}

export interface InvoiceStats {
  total: number;
  draft: number;
  posted: number;
  partiallyPaid: number;
  paid: number;
  cancelled: number;
  totalValue: number;
  outstanding: number;
}

export interface OrderForInvoicing {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: string;
  orderStatus: string;
  items: OrderItemForInvoicing[];
}

export interface OrderItemForInvoicing {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface InvoiceLineDraft {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}
