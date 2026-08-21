import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  notes: string;
  invoiceType?: 'sales' | 'purchase' | string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateInvoiceRequest {
  customerId: string;
  date: Date;
  dueDate: Date;
  discount?: number;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}

export interface RecordPaymentRequest {
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string;
  bankAccountId: string | null;
  notes?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const invoicesService = {
  // ─── Get invoices with pagination and filters ────────────────
  getInvoices: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    invoiceType?: 'all' | 'sales' | 'purchase' | string;
    locationId?: string;
  } = {}): Promise<InvoiceListResponse> => {
    const query = new URLSearchParams();
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 10;

    query.set('page', String(page));
    query.set('limit', String(limit));
    // Match Flutter: default to all (sales + purchase warehouse invoices)
    query.set('invoiceType', params.invoiceType || 'all');

    Object.entries(params).forEach(([key, value]) => {
      if (key === 'page' || key === 'limit' || key === 'invoiceType') return;
      if (value === undefined || value === null || value === '') return;
      if (key === 'status') {
        query.set('paymentStatus', String(value));
        return;
      }
      query.append(key, String(value));
    });

    const url = `/api/warehouse/invoices?${query.toString()}`;

    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch invoices');
      }

      const data = response.data || {};
      const paginationSource = data.pagination || {};
      const rawInvoices = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      const invoices: Invoice[] = rawInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId || inv.supplierId || '',
        customerName: inv.customerName || inv.supplierName || inv.partyName || '',
        date: inv.date || inv.invoiceDate,
        dueDate: inv.dueDate,
        items: (inv.items || []).map((item: any) => ({
          description: item.description || item.productName || '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          amount: Number(item.amount ?? item.totalPrice ?? item.lineTotal) || 0,
          taxRate: Number(item.taxRate) || 0,
          taxAmount: Number(item.taxAmount) || 0,
        })),
        subtotal: Number(inv.subtotal) || 0,
        taxTotal: Number(inv.taxTotal) || 0,
        discount: Number(inv.discount ?? inv.discountTotal) || 0,
        totalAmount: Number(inv.totalAmount ?? inv.grandTotal) || 0,
        paidAmount: Number(inv.paidAmount) || 0,
        outstanding: Number(inv.outstanding ?? inv.netOutstanding) || 0,
        status: inv.status || inv.paymentStatus || inv.displayStatus || 'Unpaid',
        notes: inv.notes || '',
        invoiceType: inv.invoiceType || 'sales',
      }));

      const total = Number(paginationSource.total ?? invoices.length);
      const currentPage = Number(paginationSource.page ?? page);
      const pageSize = Number(paginationSource.limit ?? limit);
      const pages = Number(
        paginationSource.pages ??
          paginationSource.totalPages ??
          Math.max(1, Math.ceil(total / pageSize) || 1)
      );
      const stats = data.stats || {};
      const summarySource = data.summary || {};

      return {
        success: response.success,
        data: invoices,
        summary: {
          totalAmount: Number(summarySource.totalAmount ?? stats.grandTotal) || 0,
          totalPaid: Number(summarySource.totalPaid ?? stats.paidAmount) || 0,
          totalOutstanding: Number(summarySource.totalOutstanding ?? stats.outstanding) || 0,
        },
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          pages,
          hasNext: paginationSource.hasNext ?? currentPage < pages,
          hasPrev: paginationSource.hasPrev ?? currentPage > 1,
        },
      };
    } catch (error: any) {
      console.error('Get invoices error:', error);
      throw new Error(error.message || 'Failed to fetch invoices');
    }
  },

  // ─── Get customers ─────────────────────────────────────────────
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get('/api/accounts-receivable/customers');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch customers');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get customers error:', error);
      return [];
    }
  },

  // ─── Get bank accounts ─────────────────────────────────────────
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      const response = await apiClient.get('/api/bank-accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Create invoice ────────────────────────────────────────────
  createInvoice: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    try {
      const payload = {
        customerId: data.customerId,
        date: data.date.toISOString().split('T')[0],
        dueDate: data.dueDate.toISOString().split('T')[0],
        discount: data.discount || 0,
        notes: data.notes || '',
        items: data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0
        }))
      };
      
      const response = await apiClient.post('/api/warehouse/invoices', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create invoice error:', error);
      throw new Error(error.message || 'Failed to create invoice');
    }
  },

  // ─── Get invoice by ID ─────────────────────────────────────────
  getInvoiceById: async (id: string): Promise<Invoice> => {
    try {
      const response = await apiClient.get(`/api/warehouse/invoices/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get invoice error:', error);
      throw new Error(error.message || 'Failed to fetch invoice');
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
      
      const response = await apiClient.post('/api/payments-received', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record payment error:', error);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Delete invoice ────────────────────────────────────────────
  deleteInvoice: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/warehouse/invoices/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      throw new Error(error.message || 'Failed to delete invoice');
    }
  },

  // ─── Update invoice ────────────────────────────────────────────
  updateInvoice: async (id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> => {
    try {
      const payload: any = {};
      if (data.customerId) payload.customerId = data.customerId;
      if (data.date) payload.date = data.date.toISOString().split('T')[0];
      if (data.dueDate) payload.dueDate = data.dueDate.toISOString().split('T')[0];
      if (data.discount !== undefined) payload.discount = data.discount;
      if (data.notes !== undefined) payload.notes = data.notes;
      if (data.items) {
        payload.items = data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0
        }));
      }
      
      const response = await apiClient.put(`/api/warehouse/invoices/${id}`, payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update invoice error:', error);
      throw new Error(error.message || 'Failed to update invoice');
    }
  },

  // ─── Export to PDF ─────────────────────────────────────────────
  exportToPdf: async (invoices: Invoice[], summary: any, filter: string, formatCurrency: (amount: number) => string): Promise<void> => {
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
        reportTitle: 'Invoices Report',
        orientation: 'landscape',
      });

      let y = startY;
      doc.setFontSize(10);
      doc.setTextColor('#666666');
      doc.text(`Filter: ${filter}`, margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setTextColor('#333333');
      doc.text('Summary', margin, y);

      const summaryData = [
        ['Total Invoices', invoices.length.toString()],
        ['Total Amount', formatCurrency(summary.totalAmount)],
        ['Total Paid', formatCurrency(summary.totalPaid)],
        ['Total Outstanding', formatCurrency(summary.totalOutstanding)],
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
      doc.text('Invoice Details', margin, tableStartY);

      const invoiceRows = invoices.map((inv) => [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString(),
        new Date(inv.dueDate).toLocaleDateString(),
        inv.customerName,
        formatCurrency(inv.totalAmount),
        formatCurrency(inv.paidAmount),
        formatCurrency(inv.outstanding),
        inv.status,
      ]);

      autoTable(doc, {
        startY: tableStartY + 4,
        head: [['Invoice #', 'Date', 'Due Date', 'Customer', 'Total', 'Paid', 'Outstanding', 'Status']],
        body: invoiceRows,
        theme: 'striped',
        headStyles: { fillColor: accentHex, textColor: '#ffffff' },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 40 },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' },
          7: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: margin, right: margin },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFontSize(10);
      doc.setTextColor('#333333');
      doc.setFont('helvetica', 'bold');

      const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding, 0);

      const totalsText = `Totals: Total: ${formatCurrency(totalAmount)}  |  Paid: ${formatCurrency(totalPaid)}  |  Outstanding: ${formatCurrency(totalOutstanding)}`;
      doc.text(totalsText, pageWidth / 2, finalY, { align: 'center' });

      finalize({
        signatureY: finalY + 4,
        filename: `invoices_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      throw new Error('Failed to export PDF');
    }
  },

  // ─── Export to Excel ────────────────────────────────────────────
  exportToExcel: async (invoices: Invoice[], summary: any, filter: string, formatCurrency: (amount: number) => string): Promise<void> => {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Invoices Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Filter: ${filter}`],
        [],
        ['SUMMARY'],
        ['Metric', 'Value'],
        ['Total Invoices', invoices.length],
        ['Total Amount', summary.totalAmount],
        ['Total Paid', summary.totalPaid],
        ['Total Outstanding', summary.totalOutstanding],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Invoices sheet
      const invoiceHeaders = [
        'Invoice #',
        'Date',
        'Due Date',
        'Customer',
        'Subtotal',
        'Tax',
        'Discount',
        'Total Amount',
        'Paid Amount',
        'Outstanding',
        'Status',
        'Notes',
      ];

      const invoiceRows = invoices.map((inv) => [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString(),
        new Date(inv.dueDate).toLocaleDateString(),
        inv.customerName,
        inv.subtotal,
        inv.taxTotal,
        inv.discount,
        inv.totalAmount,
        inv.paidAmount,
        inv.outstanding,
        inv.status,
        inv.notes || '-',
      ]);

      const invoiceSheetData = [invoiceHeaders, ...invoiceRows];
      const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceSheetData);
      invoiceSheet['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');

      // Items sheet
      const itemHeaders = [
        'Invoice #',
        'Customer',
        'Description',
        'Quantity',
        'Unit Price',
        'Amount',
        'Tax Rate',
        'Tax Amount',
      ];

      const itemRows: any[][] = [];
      invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          itemRows.push([
            inv.invoiceNumber,
            inv.customerName,
            item.description,
            item.quantity,
            item.unitPrice,
            item.amount,
            item.taxRate,
            item.taxAmount,
          ]);
        });
      });

      if (itemRows.length > 0) {
        const itemSheetData = [itemHeaders, ...itemRows];
        const itemSheet = XLSX.utils.aoa_to_sheet(itemSheetData);
        itemSheet['!cols'] = [
          { wch: 15 },
          { wch: 25 },
          { wch: 40 },
          { wch: 10 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 12 },
        ];
        XLSX.utils.book_append_sheet(workbook, itemSheet, 'Invoice Items');
      }

      XLSX.writeFile(workbook, `invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export Excel error:', error);
      throw new Error('Failed to export Excel');
    }
  }
};