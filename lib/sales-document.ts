// Normalized per-document model for Sales Order / Delivery Note / Sales Invoice
// reports (A4 print, branded PDF, JPEG).

import type { Order } from './sales-order-service';
import type { Delivery } from '@/types/delivery';
import type { SalesInvoice } from '@/types/sales-invoice';
import { addressText, dateLabel } from './customer-account';

export type SalesDocumentKind = 'order' | 'delivery' | 'invoice';

export type SalesDocumentParty = {
  name: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  billingAddress?: string;
  shippingAddress?: string;
};

export type SalesDocumentItem = {
  description: string;
  sku?: string;
  unit?: string;
  quantity: number;
  rate?: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  amount?: number;
  orderedQuantity?: number;
  deliveredQuantity?: number;
  remainingQuantity?: number;
};

export type SalesDocumentTotal = {
  label: string;
  value: number;
  format?: 'money' | 'quantity';
  emphasize?: boolean;
};

export type SalesDocumentMeta = { label: string; value: string };

export type SalesDocument = {
  kind: SalesDocumentKind;
  title: string;
  number: string;
  date: string | null;
  status: string;
  paymentStatus?: string;
  customerId?: string;
  recordId?: string;
  party: SalesDocumentParty;
  meta: SalesDocumentMeta[];
  items: SalesDocumentItem[];
  totals: SalesDocumentTotal[];
  notes?: string;
  terms?: string;
};

function text(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Invoice notes sometimes carry internal link markers that must not print. */
function cleanNotes(value?: string | null): string | undefined {
  const cleaned = text(value)
    .replace(/__LINKED_[A-Z_]+__:\s*\[[^\]]*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned || undefined;
}

export function mapOrderToDocument(order: Order): SalesDocument {
  const meta: SalesDocumentMeta[] = [
    { label: 'Order Date', value: dateLabel(order.orderDate) },
    {
      label: 'Expected Delivery',
      value: order.expectedDeliveryDate ? dateLabel(order.expectedDeliveryDate) : '—',
    },
    { label: 'Priority', value: text(order.priority) || '—' },
  ];
  if (text(order.salesPerson)) meta.push({ label: 'Salesperson', value: text(order.salesPerson) });
  if (text(order.paymentMethod))
    meta.push({ label: 'Payment Method', value: text(order.paymentMethod) });
  if (text(order.shippingMethod))
    meta.push({ label: 'Shipping Method', value: text(order.shippingMethod) });
  if (text(order.shippingCarrier))
    meta.push({ label: 'Carrier', value: text(order.shippingCarrier) });
  if (text(order.trackingNumber))
    meta.push({ label: 'Tracking No.', value: text(order.trackingNumber) });

  const discount = Number(order.discountAmount ?? order.discountTotal ?? 0) || 0;
  const tax = Number(order.taxTotal ?? 0) || 0;
  const shipping = Number(order.shippingTotal ?? 0) || 0;

  const totals: SalesDocumentTotal[] = [
    { label: 'Subtotal', value: Number(order.subtotal) || 0 },
  ];
  if (discount > 0) totals.push({ label: 'Discount', value: discount });
  if (tax > 0) totals.push({ label: 'Tax', value: tax });
  if (shipping > 0) totals.push({ label: 'Shipping', value: shipping });
  totals.push({ label: 'Grand Total', value: Number(order.grandTotal) || 0, emphasize: true });

  return {
    kind: 'order',
    title: 'SALES ORDER',
    number: order.orderNumber,
    date: order.orderDate || null,
    status: order.orderStatus,
    paymentStatus: order.paymentStatus,
    customerId: order.customerId,
    recordId: order.id || order._id,
    party: {
      name: text(order.customerName) || 'Customer',
      email: text(order.customerEmail) || undefined,
      phone: text(order.customerPhone) || undefined,
      company: text(order.customerCompany) || undefined,
      taxId: text(order.customerTaxId) || undefined,
      billingAddress: addressText(order.billingAddress as any) || undefined,
      shippingAddress: addressText(order.shippingAddress as any) || undefined,
    },
    meta,
    items: (order.items || []).map((item) => ({
      description: item.productName || item.sku || 'Item',
      sku: item.sku,
      unit: item.weightUnit || undefined,
      quantity: Number(item.quantity) || 0,
      rate: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      taxRate: Number(item.taxRate) || 0,
      taxAmount: Number(item.taxAmount) || 0,
      amount: (Number(item.totalPrice) || 0) + (Number(item.taxAmount) || 0),
    })),
    totals,
    notes: text(order.customerNotes) || text(order.orderNotes) || undefined,
    terms: undefined,
  };
}

export function mapDeliveryToDocument(delivery: Delivery): SalesDocument {
  const items = delivery.items || [];
  const totalOrdered = items.reduce((sum, item) => sum + (Number(item.orderedQuantity) || 0), 0);
  const totalDelivered = items.reduce(
    (sum, item) => sum + (Number(item.deliveredQuantity) || 0),
    0
  );
  const totalRemaining =
    Number(delivery.totalOrderedQty) && Number(delivery.totalDeliveredQty)
      ? Math.max(Number(delivery.totalOrderedQty) - Number(delivery.totalDeliveredQty), 0)
      : items.reduce((sum, item) => sum + (Number(item.remainingQuantity) || 0), 0);

  const meta: SalesDocumentMeta[] = [
    { label: 'Delivery Date', value: dateLabel(delivery.deliveryDate) },
    { label: 'Sales Order', value: text(delivery.salesOrderNumber) || '—' },
    { label: 'Delivery Person', value: text(delivery.deliveryPerson) || '—' },
    { label: 'Tracking No.', value: text(delivery.trackingNumber) || '—' },
  ];
  if (delivery.confirmedAt) {
    meta.push({ label: 'Confirmed', value: dateLabel(delivery.confirmedAt) });
  }

  return {
    kind: 'delivery',
    title: 'DELIVERY NOTE',
    number: delivery.deliveryNumber,
    date: delivery.deliveryDate || null,
    status: delivery.deliveryStatus,
    paymentStatus: delivery.paymentStatus,
    customerId: delivery.customerId,
    recordId: delivery.id,
    party: {
      name: text(delivery.customerName) || 'Customer',
    },
    meta,
    items: items.map((item) => ({
      description: item.productName || item.sku || 'Item',
      sku: item.sku,
      unit: item.unit,
      quantity: Number(item.deliveredQuantity) || 0,
      orderedQuantity: Number(item.orderedQuantity) || 0,
      deliveredQuantity: Number(item.deliveredQuantity) || 0,
      remainingQuantity: Number(item.remainingQuantity) || 0,
    })),
    totals: [
      { label: 'Total Ordered', value: totalOrdered, format: 'quantity' },
      { label: 'Total Delivered', value: totalDelivered, format: 'quantity' },
      { label: 'Total Remaining', value: totalRemaining, format: 'quantity', emphasize: true },
    ],
    notes: text(delivery.notes) || undefined,
  };
}

export function mapInvoiceToDocument(invoice: SalesInvoice): SalesDocument {
  const meta: SalesDocumentMeta[] = [
    { label: 'Invoice Date', value: dateLabel(invoice.invoiceDate) },
    { label: 'Due Date', value: dateLabel(invoice.dueDate) },
    { label: 'Payment Terms', value: text(invoice.paymentTerms) || '—' },
  ];
  if (text(invoice.orderNumber))
    meta.push({ label: 'Sales Order', value: text(invoice.orderNumber) });
  if (text(invoice.deliveryNumber))
    meta.push({ label: 'Delivery Note', value: text(invoice.deliveryNumber) });

  const discount = Number(invoice.discountTotal) || 0;
  const tax = Number(invoice.taxTotal) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  const grand = Number(invoice.grandTotal) || 0;
  const due = Math.max(Number(invoice.outstanding ?? grand - paid) || 0, 0);

  const totals: SalesDocumentTotal[] = [
    { label: 'Subtotal', value: Number(invoice.subtotal) || 0 },
  ];
  if (discount > 0) totals.push({ label: 'Discount', value: discount });
  if (tax > 0) totals.push({ label: 'Tax', value: tax });
  totals.push({ label: 'Grand Total', value: grand, emphasize: true });
  if (paid > 0) totals.push({ label: 'Amount Paid', value: paid });
  totals.push({ label: 'Balance Due', value: due, emphasize: due > 0 });

  return {
    kind: 'invoice',
    title: 'SALES INVOICE',
    number: invoice.invoiceNumber,
    date: invoice.invoiceDate || null,
    status: invoice.invoiceStatus,
    paymentStatus: invoice.paymentStatus,
    customerId: invoice.customerId,
    recordId: invoice.id,
    party: {
      name: text(invoice.customerName) || 'Customer',
      email: text(invoice.customerEmail) || undefined,
      phone: text(invoice.customerPhone) || undefined,
      billingAddress: addressText(invoice.billingAddress) || undefined,
      shippingAddress: addressText(invoice.shippingAddress) || undefined,
    },
    meta,
    items: (invoice.items || []).map((item) => ({
      description: item.productName || item.sku || 'Item',
      sku: item.sku,
      quantity: Number(item.quantity) || 0,
      rate: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      taxRate: Number(item.taxRate) || 0,
      taxAmount: Number(item.taxAmount) || 0,
      amount: Number(item.lineTotal) || 0,
    })),
    totals,
    notes: cleanNotes(invoice.notes),
    terms: text(invoice.termsConditions) || undefined,
  };
}
