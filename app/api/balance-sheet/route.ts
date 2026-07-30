import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface BalanceSheetItem {
  name: string;
  amount: number;
}

export interface BalanceSheetCategory {
  name: string;
  total: number;
  items: BalanceSheetItem[];
}

export interface BalanceSheetData {
  asOfDate: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assets: BalanceSheetCategory[];
  liabilities: BalanceSheetCategory[];
  equity: BalanceSheetCategory[];
}

export interface BalanceSheetResponse {
  success: boolean;
  data: BalanceSheetData;
  message?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const balanceSheetService = {
  // ─── Get Balance Sheet Report ──────────────────────────────
  getReport: async (params: {
    period?: string;
    fiscalYearId?: string;
  } = {}): Promise<BalanceSheetData> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/balance-sheet${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch balance sheet');
      }
      
      const data = response.data?.data || {};
      
      // Helper to parse categories
      const parseCategories = (categoryData: any): BalanceSheetCategory[] => {
        if (!categoryData || typeof categoryData !== 'object') return [];
        
        return Object.entries(categoryData)
          .map(([name, items]: [string, any]) => {
            if (!Array.isArray(items) || items.length === 0) return null;
            
            const categoryItems: BalanceSheetItem[] = items
              .filter((item: any) => item.balance !== 0)
              .map((item: any) => ({
                name: item.name || '',
                amount: item.balance || 0
              }));
            
            if (categoryItems.length === 0) return null;
            
            return {
              name: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
              total: categoryItems.reduce((sum, item) => sum + item.amount, 0),
              items: categoryItems
            };
          })
          .filter((cat): cat is BalanceSheetCategory => cat !== null);
      };

      // Parse assets
      const assetsData = data.assets || {};
      const assets = parseCategories(assetsData);

      // Parse liabilities
      const liabilitiesData = data.liabilities || {};
      const liabilities = parseCategories(liabilitiesData);

      // Parse equity
      const equityData = data.equity || {};
      let equity: BalanceSheetCategory[] = [];
      
      if (equityData && typeof equityData === 'object') {
        // Handle owners equity
        if (equityData.owners && Array.isArray(equityData.owners)) {
          const ownersItems = equityData.owners
            .filter((item: any) => item.balance !== 0)
            .map((item: any) => ({
              name: item.name || '',
              amount: item.balance || 0
            }));
          
          if (ownersItems.length > 0) {
            equity.push({
              name: 'Owners Equity',
              total: ownersItems.reduce((sum: number, item: BalanceSheetItem) => sum + item.amount, 0),
              items: ownersItems
            });
          }
        }
        
        // Handle retained earnings
        if (equityData.retainedEarnings !== undefined) {
          const retainedAmount = equityData.retainedEarnings || 0;
          if (retainedAmount !== 0) {
            const existingOwners = equity.find(e => e.name === 'Owners Equity');
            if (existingOwners) {
              existingOwners.items.push({
                name: 'Retained Earnings',
                amount: retainedAmount
              });
              existingOwners.total += retainedAmount;
            } else {
              equity.push({
                name: 'Retained Earnings',
                total: retainedAmount,
                items: [{ name: 'Retained Earnings', amount: retainedAmount }]
              });
            }
          }
        }
      }

      // Get totals
      const totals = data.totals || {};
      
      return {
        asOfDate: data.asOfDate || new Date().toISOString(),
        totalAssets: totals.totalAssets || 0,
        totalLiabilities: totals.totalLiabilities || 0,
        totalEquity: totals.totalEquity || 0,
        assets: assets,
        liabilities: liabilities,
        equity: equity
      };
    } catch (error: any) {
      console.error('Get balance sheet error:', error);
      throw new Error(error.message || 'Failed to fetch balance sheet');
    }
  },

  // ─── Export to PDF ──────────────────────────────────────────
  exportToPdf: async (data: BalanceSheetData, formatCurrency: (amount: number) => string, period: string): Promise<void> => {
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
      doc.text('Balance Sheet', pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor('#666666');
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text(`As of: ${new Date(data.asOfDate).toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text(`Period: ${period}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Summary
      doc.setFontSize(11);
      doc.setTextColor('#333333');
      doc.text('Summary', margin, y);
      y += 6;

      const summaryData = [
        ['Total Assets', formatCurrency(data.totalAssets)],
        ['Total Liabilities', formatCurrency(data.totalLiabilities)],
        ['Total Equity', formatCurrency(data.totalEquity)],
        ['Total L + E', formatCurrency(data.totalLiabilities + data.totalEquity)],
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

      // Render Categories Helper
      const renderCategorySection = (title: string, categories: BalanceSheetCategory[], total: number) => {
        if (!categories || categories.length === 0) return;

        doc.setFontSize(12);
        doc.setTextColor('#333333');
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
        y += 6;

        const rows: any[] = [];
        categories.forEach(cat => {
          rows.push([{ content: cat.name, styles: { fontStyle: 'bold' } }, { content: formatCurrency(cat.total), styles: { fontStyle: 'bold', halign: 'right' } }]);
          cat.items.forEach(item => {
            rows.push([{ content: `  ${item.name}`, styles: { fontSize: 9 } }, { content: formatCurrency(item.amount), styles: { fontSize: 9, halign: 'right' } }]);
          });
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
        doc.text(`Total ${title}`, margin, y);
        doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });
        y += 10;
      };

      // Assets
      renderCategorySection('Assets', data.assets, data.totalAssets);

      // Liabilities
      renderCategorySection('Liabilities', data.liabilities, data.totalLiabilities);

      // Equity
      renderCategorySection('Equity', data.equity, data.totalEquity);

      // Accounting Equation Check
      const totalLE = data.totalLiabilities + data.totalEquity;
      const isBalanced = Math.abs(data.totalAssets - totalLE) < 1;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#666666');
      doc.text('Accounting Equation Check:', margin, y + 5);
      y += 10;

      const eqData = [
        ['Total Assets', formatCurrency(data.totalAssets)],
        ['Total Liabilities + Equity', formatCurrency(totalLE)],
        ['Balance', isBalanced ? '✓ Balanced' : `⚠️ Difference: ${formatCurrency(Math.abs(data.totalAssets - totalLE))}`],
      ];

      autoTable(doc, {
        startY: y,
        head: [['', '']],
        body: eqData,
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

      // Save
      doc.save(`balance_sheet_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
      throw new Error('Failed to export PDF');
    }
  },

  // ─── Export to Excel ──────────────────────────────────────────
  exportToExcel: async (data: BalanceSheetData, formatCurrency: (amount: number) => string, period: string): Promise<void> => {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Balance Sheet'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`As of: ${new Date(data.asOfDate).toLocaleDateString()}`],
        [`Period: ${period}`],
        [],
        ['SUMMARY'],
        ['Metric', 'Amount'],
        ['Total Assets', data.totalAssets],
        ['Total Liabilities', data.totalLiabilities],
        ['Total Equity', data.totalEquity],
        ['Total L + E', data.totalLiabilities + data.totalEquity],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Helper to create category sheet
      const createCategorySheet = (title: string, categories: BalanceSheetCategory[]) => {
        const rows: any[][] = [
          [title],
          [],
          ['Category', 'Item', 'Amount']
        ];

        categories.forEach(cat => {
          rows.push([cat.name, '', cat.total]);
          cat.items.forEach(item => {
            rows.push(['', item.name, item.amount]);
          });
          rows.push([]);
        });

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 20 }];
        return sheet;
      };

      // Assets Sheet
      if (data.assets && data.assets.length > 0) {
        const assetsSheet = createCategorySheet('ASSETS', data.assets);
        XLSX.utils.book_append_sheet(workbook, assetsSheet, 'Assets');
      }

      // Liabilities Sheet
      if (data.liabilities && data.liabilities.length > 0) {
        const liabilitiesSheet = createCategorySheet('LIABILITIES', data.liabilities);
        XLSX.utils.book_append_sheet(workbook, liabilitiesSheet, 'Liabilities');
      }

      // Equity Sheet
      if (data.equity && data.equity.length > 0) {
        const equitySheet = createCategorySheet('EQUITY', data.equity);
        XLSX.utils.book_append_sheet(workbook, equitySheet, 'Equity');
      }

      // Accounting Equation Sheet
      const totalLE = data.totalLiabilities + data.totalEquity;
      const isBalanced = Math.abs(data.totalAssets - totalLE) < 1;

      const eqRows = [
        ['Accounting Equation Check'],
        [],
        ['Total Assets', data.totalAssets],
        ['Total Liabilities + Equity', totalLE],
        ['Balance', isBalanced ? 'Balanced ✓' : `Difference: ${Math.abs(data.totalAssets - totalLE)}`],
      ];

      const eqSheet = XLSX.utils.aoa_to_sheet(eqRows);
      eqSheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, eqSheet, 'Equation Check');

      XLSX.writeFile(workbook, `balance_sheet_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export Excel error:', error);
      throw new Error('Failed to export Excel');
    }
  }
};