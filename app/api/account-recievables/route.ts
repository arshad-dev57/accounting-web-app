import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  invoices: Invoice[];
  lastPaymentDate: string | null;
}

export interface Summary {
  totalOutstanding: number;
  overdue: number;
  dueThisWeek: number;
  dueThisMonth: number;
  activeCustomers: number;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  summary: Summary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface RecordPaymentRequest {
  customerId: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string;
  bankAccountId: string | null;
  notes?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const accountsReceivableService = {
  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (params: { locationId?: string; fiscalYearId?: string } = {}): Promise<Summary> => {
    try {
      console.log('🔍 [Accounts Receivable] Fetching summary...');
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
      const url = `/api/accounts-receivable/summary${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      console.log('📊 [Accounts Receivable] Summary API Response:', JSON.stringify(response, null, 2));
      console.log('📊 [Accounts Receivable] Summary success:', response.success);
      console.log('🔍 [Accounts Receivable] Response.data:', response.data);
      console.log('🔍 [Accounts Receivable] Response.data.data:', response.data?.data);
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Summary API failure:', response.message);
        throw new Error(response.message || 'Failed to fetch summary');
      }
      
      const summary = response.data?.data || {
        totalOutstanding: 0,
        overdue: 0,
        dueThisWeek: 0,
        dueThisMonth: 0,
        activeCustomers: 0
      };
      
      console.log('✅ [Accounts Receivable] Summary data:', JSON.stringify(summary, null, 2));
      console.log('✅ [Accounts Receivable] Summary totalOutstanding:', summary.totalOutstanding);
      console.log('✅ [Accounts Receivable] Summary overdue:', summary.overdue);
      return summary;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Summary error:', error);
      console.error('❌ [Accounts Receivable] Summary error message:', error.message);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  // ─── Get customers with pagination and filters ────────────────
  getCustomers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
    refresh?: boolean;
    locationId?: string;
    fiscalYearId?: string;
  } = {}): Promise<CustomerListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/accounts-receivable/customers${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      console.log('🔍 [Accounts Receivable] Fetching customers with params:', params);
      console.log('🔍 [Accounts Receivable] Request URL:', url);
      
      const response = await apiClient.get(url);
      
      console.log('📊 [Accounts Receivable] Customers API Response:', JSON.stringify(response, null, 2));
      console.log('📊 [Accounts Receivable] Customers success:', response.success);
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Customers API failure:', response.message);
        throw new Error(response.message || 'Failed to fetch customers');
      }
      
      const data = response.data || {};
      console.log('🔍 [Accounts Receivable] Raw customers data:', data.data);
      console.log('🔍 [Accounts Receivable] Raw summary data:', data.summary);
      console.log('🔍 [Accounts Receivable] Raw pagination data:', data.pagination);
      
      const result = {
        success: response.success,
        data: data.data || [],
        summary: data.summary || {
          totalOutstanding: 0,
          overdue: 0,
          dueThisWeek: 0,
          dueThisMonth: 0,
          activeCustomers: 0
        },
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
      
      console.log('✅ [Accounts Receivable] Transformed customers count:', result.data.length);
      console.log('✅ [Accounts Receivable] Final summary:', result.summary);
      console.log('✅ [Accounts Receivable] Final pagination:', result.pagination);
      
      return result;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Customers error:', error);
      console.error('❌ [Accounts Receivable] Customers error message:', error.message);
      console.error('❌ [Accounts Receivable] Customers error stack:', error.stack);
      throw new Error(error.message || 'Failed to fetch customers');
    }
  },

  // ─── Get bank accounts ─────────────────────────────────────────
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      console.log('🔍 [Accounts Receivable] Fetching bank accounts...');
      const response = await apiClient.get('/api/bank-accounts');
      
      console.log('📊 [Accounts Receivable] Bank accounts API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Bank accounts API failure:', response.message);
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      
      const bankAccounts = response.data?.data || [];
      console.log('✅ [Accounts Receivable] Bank accounts count:', bankAccounts.length);
      return bankAccounts;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Bank accounts error:', error);
      console.error('❌ [Accounts Receivable] Bank accounts error message:', error.message);
      return [];
    }
  },

  // ─── Create customer ───────────────────────────────────────────
  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    try {
      console.log('🔍 [Accounts Receivable] Creating customer with data:', data);
      const response = await apiClient.post('/api/accounts-receivable/customers', data);
      
      console.log('📊 [Accounts Receivable] Create customer API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Create customer API failure:', response.message);
        throw new Error(response.message || 'Failed to create customer');
      }
      
      const customer = response.data?.data;
      console.log('✅ [Accounts Receivable] Customer created successfully:', customer);
      return customer;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Create customer error:', error);
      console.error('❌ [Accounts Receivable] Create customer error message:', error.message);
      throw new Error(error.message || 'Failed to create customer');
    }
  },

  // ─── Record payment ────────────────────────────────────────────
  recordPayment: async (data: RecordPaymentRequest): Promise<any> => {
    try {
      const payload = {
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        bankAccountId: data.bankAccountId,
        notes: data.notes || ''
      };
      
      console.log('🔍 [Accounts Receivable] Recording payment with payload:', payload);
      
      const response = await apiClient.post('/api/accounts-receivable/payments', payload);
      
      console.log('📊 [Accounts Receivable] Record payment API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Record payment API failure:', response.message);
        throw new Error(response.message || 'Failed to record payment');
      }
      
      const payment = response.data?.data;
      console.log('✅ [Accounts Receivable] Payment recorded successfully:', payment);
      return payment;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Record payment error:', error);
      console.error('❌ [Accounts Receivable] Record payment error message:', error.message);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Update customer ───────────────────────────────────────────
  updateCustomer: async (id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> => {
    try {
      console.log('🔍 [Accounts Receivable] Updating customer with ID:', id);
      console.log('🔍 [Accounts Receivable] Update data:', data);
      
      const response = await apiClient.put(`/api/accounts-receivable/customers/${id}`, data);
      
      console.log('📊 [Accounts Receivable] Update customer API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Update customer API failure:', response.message);
        throw new Error(response.message || 'Failed to update customer');
      }
      
      const customer = response.data?.data;
      console.log('✅ [Accounts Receivable] Customer updated successfully:', customer);
      return customer;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Update customer error:', error);
      console.error('❌ [Accounts Receivable] Update customer error message:', error.message);
      throw new Error(error.message || 'Failed to update customer');
    }
  },

  // ─── Delete customer ───────────────────────────────────────────
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      console.log('🔍 [Accounts Receivable] Deleting customer with ID:', id);
      
      const response = await apiClient.delete(`/api/accounts-receivable/customers/${id}`);
      
      console.log('📊 [Accounts Receivable] Delete customer API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Delete customer API failure:', response.message);
        throw new Error(response.message || 'Failed to delete customer');
      }
      
      console.log('✅ [Accounts Receivable] Customer deleted successfully');
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Delete customer error:', error);
      console.error('❌ [Accounts Receivable] Delete customer error message:', error.message);
      throw new Error(error.message || 'Failed to delete customer');
    }
  },

  // ─── Get customer by ID ────────────────────────────────────────
  getCustomerById: async (id: string): Promise<Customer> => {
    try {
      console.log('🔍 [Accounts Receivable] Fetching customer by ID:', id);
      
      const response = await apiClient.get(`/api/accounts-receivable/customers/${id}`);
      
      console.log('📊 [Accounts Receivable] Get customer by ID API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ [Accounts Receivable] Get customer by ID API failure:', response.message);
        throw new Error(response.message || 'Failed to fetch customer');
      }
      
      const customer = response.data?.data;
      console.log('✅ [Accounts Receivable] Customer fetched successfully:', customer);
      return customer;
    } catch (error: any) {
      console.error('❌ [Accounts Receivable] Get customer by ID error:', error);
      console.error('❌ [Accounts Receivable] Get customer by ID error message:', error.message);
      throw new Error(error.message || 'Failed to fetch customer');
    }
  }
};

// ─── LEGACY FUNCTIONS (for backward compatibility) ─────────────

// These are kept for compatibility but use the service object internally
export async function fetchSummary(): Promise<Summary> {
  return accountsReceivableService.getSummary();
}

export async function fetchCustomers(filter?: string): Promise<Customer[]> {
  const result = await accountsReceivableService.getCustomers({ filter });
  return result.data;
}

export async function fetchBankAccounts(): Promise<BankAccount[]> {
  return accountsReceivableService.getBankAccounts();
}

export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  return accountsReceivableService.createCustomer(data);
}

export async function recordPayment(data: RecordPaymentRequest): Promise<any> {
  return accountsReceivableService.recordPayment(data);
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> {
  return accountsReceivableService.updateCustomer(id, data);
}

export async function deleteCustomer(id: string): Promise<void> {
  return accountsReceivableService.deleteCustomer(id);
}

// ─── EXPORT FUNCTIONS ──────────────────────────────────────────

// Helper: Get currency symbol (must be called from client)
export function getCurrencySymbol(): string {
  if (typeof window === 'undefined') return 'Rs.';
  try {
    const saved = localStorage.getItem('sales_selected_currency');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.symbol) return parsed.symbol;
    }
    return localStorage.getItem('app_currency_symbol') || 'Rs.';
  } catch {
    return 'Rs.';
  }
}

// Helper: Format amount
export function formatAmount(amount: number): string {
  const symbol = getCurrencySymbol();
  return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// PDF Export
export async function exportToPdf(
  customers: Customer[],
  summary: Summary,
  filter: string,
  searchQuery: string,
  currencySymbol: string = 'Rs.'
): Promise<void> {
  try {
    const autoTable = (await import('jspdf-autotable')).default;
    const { createBrandedReport } = await import('../../../lib/pdf-branding');

    const {
      doc,
      margin,
      pageWidth,
      startY,
      accentHex,
      finalize,
    } = await createBrandedReport({
      reportTitle: 'Accounts Receivable Report',
      orientation: 'landscape',
    });

    const formatAmountWithSymbol = (amount: number) => {
      return `${currencySymbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    let y = startY;
    doc.setFontSize(10);
    doc.setTextColor('#666666');
    doc.text(`Filter: ${filter}`, margin, y);
    y += 5;
    if (searchQuery) {
      doc.text(`Search: ${searchQuery}`, margin, y);
      y += 5;
    }
    y += 2;

    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.text('Summary', margin, y);

    const summaryData = [
      ['Total Outstanding', formatAmountWithSymbol(summary.totalOutstanding)],
      ['Overdue', formatAmountWithSymbol(summary.overdue)],
      ['Due This Week', formatAmountWithSymbol(summary.dueThisWeek)],
      ['Due This Month', formatAmountWithSymbol(summary.dueThisMonth)],
      ['Active Customers', summary.activeCustomers.toString()],
      ['Total Customers', customers.length.toString()],
    ];

    autoTable(doc, {
      startY: y + 4,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: accentHex, textColor: '#ffffff' },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    const tableStartY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.text('Customer Details', margin, tableStartY);

    const customerRows = customers.map((c) => [
      c.name,
      c.phone,
      c.totalInvoices.toString(),
      formatAmountWithSymbol(c.totalAmount),
      formatAmountWithSymbol(c.paidAmount),
      formatAmountWithSymbol(c.outstandingAmount),
    ]);

    autoTable(doc, {
      startY: tableStartY + 4,
      head: [['Customer', 'Phone', 'Invoices', 'Total', 'Paid', 'Outstanding']],
      body: customerRows,
      theme: 'striped',
      headStyles: { fillColor: accentHex, textColor: '#ffffff' },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    const totalAmount = customers.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalPaid = customers.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.setTextColor('#333333');
    doc.setFont('helvetica', 'bold');

    const totalsText = `Totals: Total: ${formatAmountWithSymbol(totalAmount)}  |  Paid: ${formatAmountWithSymbol(totalPaid)}  |  Outstanding: ${formatAmountWithSymbol(totalOutstanding)}`;
    doc.text(totalsText, pageWidth / 2, finalY, { align: 'center' });

    finalize({
      signatureY: finalY + 4,
      filename: `accounts_receivable_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    throw new Error('Failed to export PDF');
  }
}

// Excel Export
export async function exportToExcel(
  customers: Customer[],
  summary: Summary,
  filter: string,
  searchQuery: string
): Promise<void> {
  try {
    const XLSX = await import('xlsx');

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Accounts Receivable Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Filter: ${filter}`],
      ...(searchQuery ? [[`Search: ${searchQuery}`]] : []),
      [],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Total Outstanding', summary.totalOutstanding],
      ['Overdue', summary.overdue],
      ['Due This Week', summary.dueThisWeek],
      ['Due This Month', summary.dueThisMonth],
      ['Active Customers', summary.activeCustomers],
      ['Total Customers', customers.length],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Customers sheet
    const customerHeaders = [
      'Customer Name',
      'Email',
      'Phone',
      'Total Invoices',
      'Total Amount',
      'Paid Amount',
      'Outstanding Amount',
      'Last Payment Date',
    ];

    const customerRows = customers.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.totalInvoices,
      c.totalAmount,
      c.paidAmount,
      c.outstandingAmount,
      c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString() : '-',
    ]);

    const customerSheetData = [customerHeaders, ...customerRows];
    const customerSheet = XLSX.utils.aoa_to_sheet(customerSheetData);
    customerSheet['!cols'] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customers');

    // Invoices sheet
    const invoiceHeaders = [
      'Customer',
      'Invoice #',
      'Date',
      'Due Date',
      'Amount',
      'Paid',
      'Outstanding',
      'Status',
    ];

    const invoiceRows: any[][] = [];
    customers.forEach((customer) => {
      customer.invoices.forEach((invoice) => {
        const outstanding = invoice.amount - invoice.paidAmount;
        invoiceRows.push([
          customer.name,
          invoice.invoiceNumber,
          new Date(invoice.date).toLocaleDateString(),
          new Date(invoice.dueDate).toLocaleDateString(),
          invoice.amount,
          invoice.paidAmount,
          outstanding,
          invoice.status,
        ]);
      });
    });

    if (invoiceRows.length > 0) {
      const invoiceSheetData = [invoiceHeaders, ...invoiceRows];
      const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceSheetData);
      invoiceSheet['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');
    }

    XLSX.writeFile(workbook, `accounts_receivable_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export Excel error:', error);
    throw new Error('Failed to export Excel');
  }
}