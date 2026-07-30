import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface AgedInvoice {
  id: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
}

export interface AgedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOutstanding: number;
  invoices: AgedInvoice[];
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  daysOver90: number;
}

export interface AgedSummary {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  daysOver90: number;
  totalOutstanding: number;
}

export interface AgedReceivablesResponse {
  success: boolean;
  data: {
    customers: AgedCustomer[];
    summary: AgedSummary;
  };
  message?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const agedReceivablesService = {
  // ─── Get Aged Receivables ───────────────────────────────────
  getAgedReceivables: async (): Promise<AgedReceivablesResponse> => {
    try {
      console.log('🔍 [Aged Receivables] Fetching aged receivables data...');
      const response = await apiClient.get('/api/accounts-receivable/aged');
      
      console.log('📊 [Aged Receivables] API Response:', JSON.stringify(response, null, 2));
      console.log('📊 [Aged Receivables] Response success:', response.success);
      console.log('📊 [Aged Receivables] Response data:', response.data);
      
      if (!response.success) {
        console.error('❌ [Aged Receivables] API returned failure:', response.message);
        throw new Error(response.message || 'Failed to fetch aged receivables');
      }
      
      const data = response.data || {};
      console.log('🔍 [Aged Receivables] Raw customers data:', data.customers);
      console.log('🔍 [Aged Receivables] Raw summary data:', data.summary);
      
      // Transform data to match our types
      const customers = (data.customers || []).map((c: any) => ({
        id: c.id || '',
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        totalOutstanding: c.totalOutstanding || 0,
        current: c.current || 0,
        days1to30: c.days1to30 || 0,
        days31to60: c.days31to60 || 0,
        days61to90: c.days61to90 || 0,
        daysOver90: c.daysOver90 || 0,
        invoices: (c.invoices || []).map((inv: any) => ({
          id: inv.invoiceNumber || inv.id || '',
          date: inv.invoiceDate || inv.date || new Date().toISOString(),
          dueDate: inv.dueDate || new Date().toISOString(),
          amount: inv.amount || 0,
          paidAmount: inv.paidAmount || 0
        }))
      }));

      console.log('✅ [Aged Receivables] Transformed customers:', customers.length);
      console.log('✅ [Aged Receivables] Sample customer:', customers[0] || 'No customers');

      const summary = data.summary || {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        daysOver90: 0,
        totalOutstanding: 0
      };

      console.log('✅ [Aged Receivables] Summary:', summary);

      return {
        success: true,
        data: {
          customers,
          summary
        }
      };
    } catch (error: any) {
      console.error('❌ [Aged Receivables] Error:', error);
      console.error('❌ [Aged Receivables] Error message:', error.message);
      console.error('❌ [Aged Receivables] Error stack:', error.stack);
      throw new Error(error.message || 'Failed to fetch aged receivables');
    }
  },

  // ─── Export to Excel ──────────────────────────────────────────
  exportToExcel: async (
    customers: AgedCustomer[],
    summary: AgedSummary,
    asAtDate: Date,
    formatCurrency: (amount: number) => string
  ): Promise<void> => {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Aged Receivables Report'],
        [`As at: ${asAtDate.toLocaleDateString()}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['SUMMARY'],
        ['Bucket', 'Amount'],
        ['Current', summary.current],
        ['1-30 Days', summary.days1to30],
        ['31-60 Days', summary.days31to60],
        ['61-90 Days', summary.days61to90],
        ['90+ Days', summary.daysOver90],
        ['Total Outstanding', summary.totalOutstanding],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Customers Sheet
      const customerHeaders = [
        'Customer Name',
        'Email',
        'Phone',
        'Current',
        '1-30 Days',
        '31-60 Days',
        '61-90 Days',
        '90+ Days',
        'Total Outstanding',
        'Invoice Count'
      ];

      const customerRows = customers.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.current,
        c.days1to30,
        c.days31to60,
        c.days61to90,
        c.daysOver90,
        c.totalOutstanding,
        c.invoices.length
      ]);

      const customerSheetData = [customerHeaders, ...customerRows];
      const customerSheet = XLSX.utils.aoa_to_sheet(customerSheetData);
      customerSheet['!cols'] = [
        { wch: 30 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customers');

      // Invoices Sheet
      const invoiceHeaders = [
        'Customer',
        'Invoice #',
        'Date',
        'Due Date',
        'Amount',
        'Paid',
        'Outstanding',
        'Days Overdue'
      ];

      const invoiceRows: any[][] = [];
      customers.forEach((customer) => {
        customer.invoices.forEach((invoice) => {
          const outstanding = invoice.amount - invoice.paidAmount;
          const daysOverdue = Math.floor(
            (asAtDate.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          invoiceRows.push([
            customer.name,
            invoice.id,
            new Date(invoice.date).toLocaleDateString(),
            new Date(invoice.dueDate).toLocaleDateString(),
            invoice.amount,
            invoice.paidAmount,
            outstanding,
            daysOverdue > 0 ? daysOverdue : 0
          ]);
        });
      });

      if (invoiceRows.length > 0) {
        const invoiceSheetData = [invoiceHeaders, ...invoiceRows];
        const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceSheetData);
        invoiceSheet['!cols'] = [
          { wch: 30 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');
      }

      XLSX.writeFile(workbook, `aged_receivables_${asAtDate.toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export Excel error:', error);
      throw new Error('Failed to export Excel');
    }
  }
};