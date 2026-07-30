import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface ReportItem {
  name: string;
  amount: number;
}

export interface PLData {
  periodText: string;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  revenueItems: ReportItem[];
  expenseItems: ReportItem[];
  otherIncomeItems: ReportItem[];
  otherExpenseItems: ReportItem[];
}

export interface PLReportResponse {
  success: boolean;
  data: PLData;
  message?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const profitLossService = {
  // ─── Get Profit & Loss Report ──────────────────────────────
  getReport: async (params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
  } = {}): Promise<PLData> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/reports/profit-loss${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch report');
      }
      
      const data = response.data?.data || {};
      
      return {
        periodText: data.period?.displayText || '',
        totalRevenue: data.revenue?.total || 0,
        costOfGoodsSold: data.costOfGoodsSold || 0,
        grossProfit: data.grossProfit || 0,
        operatingExpenses: data.operatingExpenses?.total || 0,
        netProfit: data.netProfit || 0,
        netProfitMargin: data.netProfitMargin || 0,
        revenueItems: (data.revenue?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0
        })),
        expenseItems: (data.operatingExpenses?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0
        })),
        otherIncomeItems: (data.otherIncome?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0
        })),
        otherExpenseItems: (data.otherExpenses?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0
        }))
      };
    } catch (error: any) {
      console.error('Get report error:', error);
      throw new Error(error.message || 'Failed to fetch report');
    }
  },

  // ─── Export to PDF ──────────────────────────────────────────
  exportToPdf: async (data: PLData, formatCurrency: (amount: number) => string): Promise<void> => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setTextColor('#7c4dff');
      doc.text('Profit & Loss Statement', pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor('#666666');
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text(`Period: ${data.periodText}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Summary
      doc.setFontSize(11);
      doc.setTextColor('#333333');
      doc.text('Summary', margin, y);
      y += 6;

      const summaryData = [
        ['Total Revenue', formatCurrency(data.totalRevenue)],
        ['Cost of Goods Sold', formatCurrency(data.costOfGoodsSold)],
        ['Gross Profit', formatCurrency(data.grossProfit)],
        ['Operating Expenses', formatCurrency(data.operatingExpenses)],
        ['Net Profit', formatCurrency(data.netProfit)],
        ['Net Profit Margin', `${data.netProfitMargin.toFixed(2)}%`],
      ];

      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Amount']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: '#7c4dff', textColor: '#ffffff' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Revenue Section
      doc.setFontSize(12);
      doc.setTextColor('#2E7D32');
      doc.text('Revenue', margin, y);
      y += 6;

      const revenueRows = data.revenueItems.map((item) => [item.name, formatCurrency(item.amount)]);
      revenueRows.push(['Total Revenue', formatCurrency(data.totalRevenue)]);

      autoTable(doc, {
        startY: y,
        head: [['Description', 'Amount']],
        body: revenueRows,
        theme: 'plain',
        headStyles: { fillColor: '#E8F5E9', textColor: '#2E7D32' },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Expenses Section
      doc.setFontSize(12);
      doc.setTextColor('#C62828');
      doc.text('Operating Expenses', margin, y);
      y += 6;

      const expenseRows = data.expenseItems.map((item) => [item.name, formatCurrency(item.amount)]);
      expenseRows.push(['Total Operating Expenses', formatCurrency(data.operatingExpenses)]);

      autoTable(doc, {
        startY: y,
        head: [['Description', 'Amount']],
        body: expenseRows,
        theme: 'plain',
        headStyles: { fillColor: '#FFEBEE', textColor: '#C62828' },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Other Income/Expenses
      if (data.otherIncomeItems.length > 0 || data.otherExpenseItems.length > 0) {
        if (data.otherIncomeItems.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor('#2E7D32');
          doc.text('Other Income', margin, y);
          y += 6;

          const otherIncomeRows = data.otherIncomeItems.map((item) => [item.name, formatCurrency(item.amount)]);
          const totalOtherIncome = data.otherIncomeItems.reduce((sum, item) => sum + item.amount, 0);
          otherIncomeRows.push(['Total Other Income', formatCurrency(totalOtherIncome)]);

          autoTable(doc, {
            startY: y,
            head: [['Description', 'Amount']],
            body: otherIncomeRows,
            theme: 'plain',
            headStyles: { fillColor: '#E8F5E9', textColor: '#2E7D32' },
            styles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 60, halign: 'right' },
            },
            margin: { left: margin, right: margin },
          });

          y = (doc as any).lastAutoTable.finalY + 10;
        }

        if (data.otherExpenseItems.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor('#C62828');
          doc.text('Other Expenses', margin, y);
          y += 6;

          const otherExpenseRows = data.otherExpenseItems.map((item) => [item.name, formatCurrency(item.amount)]);
          const totalOtherExpense = data.otherExpenseItems.reduce((sum, item) => sum + item.amount, 0);
          otherExpenseRows.push(['Total Other Expenses', formatCurrency(totalOtherExpense)]);

          autoTable(doc, {
            startY: y,
            head: [['Description', 'Amount']],
            body: otherExpenseRows,
            theme: 'plain',
            headStyles: { fillColor: '#FFEBEE', textColor: '#C62828' },
            styles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 60, halign: 'right' },
            },
            margin: { left: margin, right: margin },
          });

          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Net Profit
      doc.setFontSize(14);
      const isProfit = data.netProfit >= 0;
      doc.setTextColor(isProfit ? '#2E7D32' : '#C62828');
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Net ${isProfit ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(data.netProfit))}`,
        pageWidth / 2,
        y + 10,
        { align: 'center' }
      );
      y += 16;

      doc.setFontSize(10);
      doc.setTextColor('#666666');
      doc.setFont('helvetica', 'normal');
      doc.text(`Profit Margin: ${data.netProfitMargin.toFixed(2)}%`, pageWidth / 2, y + 10, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor('#999999');
      doc.text('Confidential - For Internal Use Only', margin, doc.internal.pageSize.getHeight() - 10);
      doc.text('Page 1 of 1', pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });

      // Save
      doc.save(`profit_loss_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
      throw new Error('Failed to export PDF');
    }
  },

  // ─── Export to Excel ──────────────────────────────────────────
  exportToExcel: async (data: PLData, formatCurrency: (amount: number) => string): Promise<void> => {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Profit & Loss Statement'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Period: ${data.periodText}`],
        [],
        ['SUMMARY'],
        ['Metric', 'Amount'],
        ['Total Revenue', data.totalRevenue],
        ['Cost of Goods Sold', data.costOfGoodsSold],
        ['Gross Profit', data.grossProfit],
        ['Operating Expenses', data.operatingExpenses],
        ['Net Profit', data.netProfit],
        ['Net Profit Margin', `${data.netProfitMargin.toFixed(2)}%`],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Revenue Sheet
      const revenueRows = [
        ['Revenue'],
        ['Description', 'Amount'],
        ...data.revenueItems.map((item) => [item.name, item.amount]),
        ['Total Revenue', data.totalRevenue],
      ];
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueRows);
      revenueSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue');

      // Expenses Sheet
      const expenseRows = [
        ['Operating Expenses'],
        ['Description', 'Amount'],
        ...data.expenseItems.map((item) => [item.name, item.amount]),
        ['Total Operating Expenses', data.operatingExpenses],
      ];
      const expenseSheet = XLSX.utils.aoa_to_sheet(expenseRows);
      expenseSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');

      // Other Income Sheet
      if (data.otherIncomeItems.length > 0) {
        const otherIncomeRows = [
          ['Other Income'],
          ['Description', 'Amount'],
          ...data.otherIncomeItems.map((item) => [item.name, item.amount]),
          ['Total Other Income', data.otherIncomeItems.reduce((sum, item) => sum + item.amount, 0)],
        ];
        const otherIncomeSheet = XLSX.utils.aoa_to_sheet(otherIncomeRows);
        otherIncomeSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, otherIncomeSheet, 'Other Income');
      }

      // Other Expenses Sheet
      if (data.otherExpenseItems.length > 0) {
        const otherExpenseRows = [
          ['Other Expenses'],
          ['Description', 'Amount'],
          ...data.otherExpenseItems.map((item) => [item.name, item.amount]),
          ['Total Other Expenses', data.otherExpenseItems.reduce((sum, item) => sum + item.amount, 0)],
        ];
        const otherExpenseSheet = XLSX.utils.aoa_to_sheet(otherExpenseRows);
        otherExpenseSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, otherExpenseSheet, 'Other Expenses');
      }

      // Profit Summary Sheet
      const profitRows = [
        ['Profit Summary'],
        ['Net Profit / (Loss)', data.netProfit],
        ['Net Profit Margin', `${data.netProfitMargin.toFixed(2)}%`],
      ];
      const profitSheet = XLSX.utils.aoa_to_sheet(profitRows);
      profitSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, profitSheet, 'Profit Summary');

      XLSX.writeFile(workbook, `profit_loss_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export Excel error:', error);
      throw new Error('Failed to export Excel');
    }
  }
};