import { apiClient } from '@/lib/api-client';

export type InstallmentReportSide = 'sales' | 'purchase';

export type InstallmentLine = {
  id: string;
  invoiceId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  status: string;
  paidAt?: string | null;
  salesPaymentId?: string | null;
  purchasePaymentId?: string | null;
  notes?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    customerId?: string;
    customerName?: string;
    supplierId?: string;
    supplierName?: string;
    grandTotal?: number;
    outstanding?: number;
    isInstallmentSale?: boolean;
    isInstallmentPurchase?: boolean;
  };
};

export type InstallmentSummary = {
  scheduledTotal: number;
  paidTotal: number;
  outstandingTotal: number;
  overdueTotal: number;
  nextDueDate?: string | null;
  nextDueAmount?: number;
  lineCount?: number;
  paidLineCount?: number;
};

export async function fetchInstallmentReport(params: {
  side?: InstallmentReportSide;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const q = new URLSearchParams();
  if (params.side) q.set('side', params.side);
  if (params.status) q.set('status', params.status);
  if (params.fromDate) q.set('fromDate', params.fromDate);
  if (params.toDate) q.set('toDate', params.toDate);
  const res = await apiClient.get(`/api/installments/report?${q.toString()}`);
  return res.data?.data || res.data;
}

export async function fetchSalesInstallmentSchedule(invoiceId: string) {
  const res = await apiClient.get(
    `/api/installments/sales-invoices/${invoiceId}/schedule`
  );
  return (res.data?.data || res.data) as {
    lines: InstallmentLine[];
    summary: InstallmentSummary;
  };
}

export async function fetchPurchaseInstallmentSchedule(invoiceId: string) {
  const res = await apiClient.get(
    `/api/installments/purchase-invoices/${invoiceId}/schedule`
  );
  return (res.data?.data || res.data) as {
    lines: InstallmentLine[];
    summary: InstallmentSummary;
  };
}

export async function fetchCustomerInstallmentSummary(customerId: string) {
  const res = await apiClient.get(`/api/installments/customers/${customerId}/summary`);
  return res.data?.data || res.data;
}

export async function fetchSupplierInstallmentSummary(supplierId: string) {
  const res = await apiClient.get(`/api/installments/suppliers/${supplierId}/summary`);
  return res.data?.data || res.data;
}

export async function markInstallmentsOverdue() {
  const res = await apiClient.post('/api/installments/mark-overdue', {});
  return res.data?.data || res.data;
}

export async function sendInstallmentReminder(invoiceId: string, email?: string) {
  const res = await apiClient.post(
    `/api/installments/sales-invoices/${invoiceId}/send-reminder`,
    email ? { email } : {}
  );
  return res.data;
}

export async function fetchInstallmentReminders(params?: {
  side?: InstallmentReportSide;
  daysAhead?: number;
}) {
  const q = new URLSearchParams();
  if (params?.side) q.set('side', params.side);
  if (params?.daysAhead != null) q.set('daysAhead', String(params.daysAhead));
  const res = await apiClient.get(`/api/installments/reminders?${q.toString()}`);
  return res.data?.data || res.data || [];
}
