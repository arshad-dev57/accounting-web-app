import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface CashFlowItem {
  name: string;
  amount: number;
  type: string;
}

export interface CashFlowData {
  periodText: string;
  openingCashBalance: number;
  closingCashBalance: number;
  netCashFlow: number;
  netCashFlowPercentage: number;
  cashFlowFromOperations: number;
  cashFlowFromInvesting: number;
  cashFlowFromFinancing: number;
  operatingItems: CashFlowItem[];
  investingItems: CashFlowItem[];
  financingItems: CashFlowItem[];
}

export interface CashFlowResponse {
  success: boolean;
  data: CashFlowData;
  message?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const cashFlowService = {
  // ─── Get Cash Flow Report ──────────────────────────────────
  getReport: async (params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
  } = {}): Promise<CashFlowData> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/reports/cash-flow${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch cash flow statement');
      }
      
      const data = response.data?.data || {};
      
      return {
        periodText: data.period?.displayText || '',
        openingCashBalance: data.openingCashBalance || 0,
        closingCashBalance: data.closingCashBalance || 0,
        netCashFlow: data.netCashFlow || 0,
        netCashFlowPercentage: data.netCashFlowPercentage || 0,
        cashFlowFromOperations: data.operatingActivities?.total || 0,
        cashFlowFromInvesting: data.investingActivities?.total || 0,
        cashFlowFromFinancing: data.financingActivities?.total || 0,
        operatingItems: (data.operatingActivities?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0,
          type: item.type || 'operating'
        })),
        investingItems: (data.investingActivities?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0,
          type: item.type || 'investing'
        })),
        financingItems: (data.financingActivities?.items || []).map((item: any) => ({
          name: item.name || '',
          amount: item.amount || 0,
          type: item.type || 'financing'
        }))
      };
    } catch (error: any) {
      console.error('Get cash flow error:', error);
      throw new Error(error.message || 'Failed to fetch cash flow statement');
    }
  },

  // ─── Export to PDF ──────────────────────────────────────────
  exportToPdf: async (data: CashFlowData, formatCurrency: (amount: number) => string, period: string): Promise<void> => {
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
      doc.text('Cash Flow Statement', pageWidth / 2, y, { align: 'center' });
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
        ['Opening Cash Balance', formatCurrency(data.openingCashBalance)],
        ['Net Cash Flow', formatCurrency(data.netCashFlow)],
        ['Closing Cash Balance', formatCurrency(data.closingCashBalance)],
        ['Net Cash Flow Change', `${data.netCashFlowPercentage.toFixed(1)}%`],
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

      // Helper to render activity sections
      const renderActivitySection = (title: string, items: CashFlowItem[], total: number, color: string) => {
        if (!items || items.length === 0) return;

        doc.setFontSize(12);
        doc.setTextColor('#333333');
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
        y += 6;

        const rows: any[] = [];
        items.forEach(item => {
          const isPositive = item.amount >= 0;
          rows.push([
            item.name,
            { content: formatCurrency(Math.abs(item.amount)), styles: { halign: 'right', textColor: isPositive ? '#2E7D32' : '#C62828' } }
          ]);
        });

        if (rows.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Description', 'Amount']],
            body: rows,
            theme: 'plain',
            headStyles: { fillColor: '#F5F5F5', textColor: '#333333' },
            styles: { fontSize: 9 },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 60, halign: 'right' },
            },
            margin: { left: margin, right: margin },
          });

          y = (doc as any).lastAutoTable.finalY + 4;
        }

        // Total
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const isTotalPositive = total >= 0;
        doc.setTextColor(isTotalPositive ? '#2E7D32' : '#C62828');
        doc.text(`Net ${title}`, margin, y);
        doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });
        y += 10;
        doc.setTextColor('#333333');
      };

      // Operating Activities
      renderActivitySection('Cash Flow from Operating Activities', data.operatingItems, data.cashFlowFromOperations, 'green');

      // Investing Activities
      renderActivitySection('Cash Flow from Investing Activities', data.investingItems, data.cashFlowFromInvesting, 'orange');

      // Financing Activities
      renderActivitySection('Cash Flow from Financing Activities', data.financingItems, data.cashFlowFromFinancing, 'red');

      // Net Cash Flow
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const isNetPositive = data.netCashFlow >= 0;
      doc.setTextColor(isNetPositive ? '#2E7D32' : '#C62828');
      doc.text('Net Cash Flow', margin, y);
      doc.text(formatCurrency(data.netCashFlow), pageWidth - margin, y, { align: 'right' });
      y += 8;
      doc.setTextColor('#666666');
      doc.setFont('helvetica', 'normal');
      doc.text(`Net Cash Flow Change: ${data.netCashFlowPercentage.toFixed(1)}%`, margin, y);
      y += 12;

      // Reconciliation
      doc.setFontSize(11);
      doc.setTextColor('#333333');
      doc.setFont('helvetica', 'bold');
      doc.text('Cash Balance Reconciliation', margin, y);
      y += 6;

      const reconData = [
        ['Opening Cash Balance', formatCurrency(data.openingCashBalance)],
        ['Add: Net Cash Flow', formatCurrency(data.netCashFlow)],
        ['Closing Cash Balance', formatCurrency(data.closingCashBalance)],
      ];

      autoTable(doc, {
        startY: y,
        head: [['', '']],
        body: reconData,
        theme: 'striped',
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });

      // Footer
      y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor('#999999');
      doc.text('Confidential - For Internal Use Only', margin, doc.internal.pageSize.getHeight() - 10);
      doc.text('Page 1 of 1', pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });

      doc.save(`cash_flow_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
      throw new Error('Failed to export PDF');
    }
  },

  // ─── Export to Excel ──────────────────────────────────────────
  exportToExcel: async (data: CashFlowData, formatCurrency: (amount: number) => string, period: string): Promise<void> => {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Cash Flow Statement'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Period: ${data.periodText}`],
        [],
        ['SUMMARY'],
        ['Metric', 'Amount'],
        ['Opening Cash Balance', data.openingCashBalance],
        ['Net Cash Flow', data.netCashFlow],
        ['Closing Cash Balance', data.closingCashBalance],
        ['Net Cash Flow Change', `${data.netCashFlowPercentage.toFixed(1)}%`],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Helper to create activity sheet
      const createActivitySheet = (title: string, items: CashFlowItem[], total: number) => {
        const rows: any[][] = [
          [title],
          [],
          ['Description', 'Amount']
        ];

        items.forEach(item => {
          rows.push([item.name, item.amount]);
        });

        rows.push([]);
        rows.push(['Net Total', total]);

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
        return sheet;
      };

      // Operating Activities Sheet
      if (data.operatingItems.length > 0) {
        const operatingSheet = createActivitySheet('Operating Activities', data.operatingItems, data.cashFlowFromOperations);
        XLSX.utils.book_append_sheet(workbook, operatingSheet, 'Operating');
      }

      // Investing Activities Sheet
      if (data.investingItems.length > 0) {
        const investingSheet = createActivitySheet('Investing Activities', data.investingItems, data.cashFlowFromInvesting);
        XLSX.utils.book_append_sheet(workbook, investingSheet, 'Investing');
      }

      // Financing Activities Sheet
      if (data.financingItems.length > 0) {
        const financingSheet = createActivitySheet('Financing Activities', data.financingItems, data.cashFlowFromFinancing);
        XLSX.utils.book_append_sheet(workbook, financingSheet, 'Financing');
      }

      // Reconciliation Sheet
      const reconRows = [
        ['Cash Balance Reconciliation'],
        [],
        ['Opening Cash Balance', data.openingCashBalance],
        ['Add: Net Cash Flow', data.netCashFlow],
        ['Closing Cash Balance', data.closingCashBalance],
      ];

      const reconSheet = XLSX.utils.aoa_to_sheet(reconRows);
      reconSheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, reconSheet, 'Reconciliation');

      // Totals Sheet
      const totalsRows = [
        ['Cash Flow Summary'],
        [],
        ['Cash Flow from Operations', data.cashFlowFromOperations],
        ['Cash Flow from Investing', data.cashFlowFromInvesting],
        ['Cash Flow from Financing', data.cashFlowFromFinancing],
        ['Net Cash Flow', data.netCashFlow],
      ];

      const totalsSheet = XLSX.utils.aoa_to_sheet(totalsRows);
      totalsSheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Totals');

      XLSX.writeFile(workbook, `cash_flow_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export Excel error:', error);
      throw new Error('Failed to export Excel');
    }
  }
};