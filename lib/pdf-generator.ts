import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── TYPES ─────────────────────────────────────────────────────

export interface DocumentItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  lineTotal: number;
  description?: string;
}

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface RecipientInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface DocumentMetadata {
  documentNumber: string;
  documentDate: string;
  dueDate?: string;
  expectedDate?: string;
  documentType: 'Invoice' | 'Purchase Order' | 'Receipt' | 'Quotation' | 'Sales Order' | 'Goods Receiving Note';
}

export interface DocumentTotals {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
}

export interface PDFGeneratorData {
  company: CompanyInfo;
  recipient: RecipientInfo;
  metadata: DocumentMetadata;
  items: DocumentItem[];
  totals: DocumentTotals;
  notes?: string;
  termsConditions?: string;
  currency?: string;
}

// ─── PDF GENERATOR CLASS ─────────────────────────────────────

class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private yPosition: number;
  private currency: string;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.yPosition = this.margin;
    this.currency = 'PKR';
  }

  private formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return `${this.currency} 0.00`;
    return `${this.currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private addHeader(data: PDFGeneratorData): void {
    // Company Logo
    if (data.company.logo) {
      try {
        this.doc.addImage(data.company.logo, 'PNG', this.margin, this.yPosition, 30, 30);
        this.yPosition += 35;
      } catch (error) {
        console.error('Failed to add company logo:', error);
      }
    }

    // Company Name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.company.name, this.margin, this.yPosition);

    // Company Details
    this.yPosition += 8;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(80);
    if (data.company.address) {
      this.doc.text(data.company.address, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    if (data.company.phone) {
      this.doc.text(`Phone: ${data.company.phone}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    if (data.company.email) {
      this.doc.text(`Email: ${data.company.email}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }

    // Document Title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0);
    this.doc.text(data.metadata.documentType.toUpperCase(), this.pageWidth - this.margin, this.yPosition - 15, { align: 'right' });

    // Document Number and Date
    this.yPosition += 10;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${data.metadata.documentType} No: ${data.metadata.documentNumber}`, this.pageWidth - this.margin, this.yPosition, { align: 'right' });
    this.yPosition += 6;
    this.doc.text(`${data.metadata.documentType} Date: ${this.formatDate(data.metadata.documentDate)}`, this.pageWidth - this.margin, this.yPosition, { align: 'right' });
    
    if (data.metadata.dueDate) {
      this.yPosition += 6;
      this.doc.text(`Due Date: ${this.formatDate(data.metadata.dueDate)}`, this.pageWidth - this.margin, this.yPosition, { align: 'right' });
    }
    if (data.metadata.expectedDate) {
      this.yPosition += 6;
      this.doc.text(`Expected: ${this.formatDate(data.metadata.expectedDate)}`, this.pageWidth - this.margin, this.yPosition, { align: 'right' });
    }

    // Horizontal Line
    this.yPosition += 15;
    this.doc.setDrawColor(0);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 10;
  }

  private addRecipient(data: PDFGeneratorData): void {
    const recipientLabel = data.metadata.documentType === 'Purchase Order' ? 'Bill To:' : 'Bill To:';
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0);
    this.doc.text(recipientLabel, this.margin, this.yPosition);

    this.yPosition += 7;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(80);
    this.doc.text(data.recipient.name, this.margin, this.yPosition);
    this.yPosition += 5;
    if (data.recipient.address) {
      this.doc.text(data.recipient.address, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    if (data.recipient.phone) {
      this.doc.text(`Phone: ${data.recipient.phone}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    if (data.recipient.email) {
      this.doc.text(`Email: ${data.recipient.email}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }
  }

  private addItemsTable(data: PDFGeneratorData): void {
    this.yPosition += 10;

    const tableData = data.items.map(item => [
      item.name || '',
      item.sku || '-',
      (item.quantity !== undefined && item.quantity !== null) ? item.quantity.toString() : '0',
      this.formatCurrency(item.unitPrice || 0),
      `${item.discount || 0}%`,
      `${item.taxRate || 0}%`,
      this.formatCurrency(item.lineTotal || 0)
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Item Name', 'SKU', 'Qty', 'Unit Price', 'Discount %', 'Tax %', 'Line Total']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 15;
  }

  private addTotals(data: PDFGeneratorData): void {
    const summaryX = this.pageWidth - this.margin - 80;
    const summaryY = this.yPosition;

    this.doc.setDrawColor(0);
    this.doc.setLineWidth(0.5);
    this.doc.rect(summaryX, summaryY, 80, 80);

    let summaryYPos = summaryY + 10;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Subtotal:', summaryX + 5, summaryYPos);
    this.doc.text(this.formatCurrency(data.totals.subtotal), summaryX + 75, summaryYPos, { align: 'right' });

    summaryYPos += 8;
    this.doc.text('Discount:', summaryX + 5, summaryYPos);
    this.doc.setTextColor(200, 0, 0);
    this.doc.text(`-${this.formatCurrency(data.totals.totalDiscount)}`, summaryX + 75, summaryYPos, { align: 'right' });
    this.doc.setTextColor(0);

    summaryYPos += 8;
    this.doc.text('Tax:', summaryX + 5, summaryYPos);
    this.doc.text(this.formatCurrency(data.totals.totalTax), summaryX + 75, summaryYPos, { align: 'right' });

    summaryYPos += 10;
    this.doc.setDrawColor(0);
    this.doc.line(summaryX + 5, summaryYPos, summaryX + 75, summaryYPos);

    summaryYPos += 10;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Grand Total:', summaryX + 5, summaryYPos);
    this.doc.text(this.formatCurrency(data.totals.grandTotal), summaryX + 75, summaryYPos, { align: 'right' });

    this.yPosition = summaryY + 90;
  }

  private addNotesAndTerms(data: PDFGeneratorData): void {
    if (data.notes || data.termsConditions) {
      this.yPosition += 10;

      if (data.notes) {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Notes:', this.margin, this.yPosition);
        this.yPosition += 6;
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(80);
        const noteLines = this.doc.splitTextToSize(data.notes, this.contentWidth);
        this.doc.text(noteLines, this.margin, this.yPosition);
        this.yPosition += (noteLines.length * 5) + 10;
      }

      if (data.termsConditions) {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(0);
        this.doc.text('Terms & Conditions:', this.margin, this.yPosition);
        this.yPosition += 6;
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(80);
        const termsLines = this.doc.splitTextToSize(data.termsConditions, this.contentWidth);
        this.doc.text(termsLines, this.margin, this.yPosition);
        this.yPosition += (termsLines.length * 5) + 10;
      }
    }
  }

  private addFooter(data: PDFGeneratorData): void {
    this.yPosition = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128);
    this.doc.text(
      `This is a computer-generated ${data.metadata.documentType.toLowerCase()}. No signature required.`,
      this.pageWidth / 2,
      this.yPosition,
      { align: 'center' }
    );
  }

  public generate(data: PDFGeneratorData): jsPDF {
    this.currency = data.currency || 'PKR';
    
    this.addHeader(data);
    this.addRecipient(data);
    this.addItemsTable(data);
    this.addTotals(data);
    this.addNotesAndTerms(data);
    this.addFooter(data);

    return this.doc;
  }

  public generateBlob(data: PDFGeneratorData): Blob {
    const doc = this.generate(data);
    return doc.output('blob');
  }

  public save(data: PDFGeneratorData, filename?: string): void {
    const doc = this.generate(data);
    const defaultFilename = `${data.metadata.documentType.replace(/\s+/g, '_')}_${data.metadata.documentNumber}.pdf`;
    doc.save(filename || defaultFilename);
  }
}

// ─── EXPORT FUNCTIONS ─────────────────────────────────────────

export const generatePDF = (data: PDFGeneratorData): jsPDF => {
  const generator = new PDFGenerator();
  return generator.generate(data);
};

export const generatePDFBlob = (data: PDFGeneratorData): Blob => {
  const generator = new PDFGenerator();
  return generator.generateBlob(data);
};

export const savePDF = (data: PDFGeneratorData, filename?: string): void => {
  const generator = new PDFGenerator();
  generator.save(data, filename);
};

// ─── HELPER FUNCTIONS ───────────────────────────────────────────

export const createPurchaseOrderPDFData = (
  orderData: any,
  companyInfo: CompanyInfo
): PDFGeneratorData => ({
  company: companyInfo,
  recipient: {
    name: orderData.supplierName,
    address: orderData.supplierAddress,
    phone: orderData.supplierPhone,
    email: orderData.supplierEmail
  },
  metadata: {
    documentNumber: orderData.orderNumber,
    documentDate: orderData.orderDate,
    expectedDate: orderData.expectedDeliveryDate,
    documentType: 'Purchase Order'
  },
  items: orderData.items.map((item: any) => ({
    name: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: item.taxRate,
    lineTotal: item.lineTotal
  })),
  totals: {
    subtotal: orderData.subtotal,
    totalDiscount: orderData.totalDiscount,
    totalTax: orderData.totalTax,
    grandTotal: orderData.grandTotal
  },
  notes: orderData.notes,
  termsConditions: orderData.termsConditions,
  currency: 'PKR'
});

export const createInvoicePDFData = (
  invoiceData: any,
  companyInfo: CompanyInfo
): PDFGeneratorData => ({
  company: companyInfo,
  recipient: {
    name: invoiceData.customerName || invoiceData.supplierName,
    address: invoiceData.customerAddress || invoiceData.supplierAddress,
    phone: invoiceData.customerPhone || invoiceData.supplierPhone,
    email: invoiceData.customerEmail || invoiceData.supplierEmail
  },
  metadata: {
    documentNumber: invoiceData.invoiceNumber,
    documentDate: invoiceData.invoiceDate,
    dueDate: invoiceData.dueDate,
    documentType: 'Invoice'
  },
  items: invoiceData.items.map((item: any) => ({
    name: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: item.taxRate,
    lineTotal: item.lineTotal
  })),
  totals: {
    subtotal: invoiceData.subtotal || 0,
    totalDiscount: invoiceData.totalDiscount || 0,
    totalTax: invoiceData.totalTax || 0,
    grandTotal: invoiceData.grandTotal || 0
  },
  notes: invoiceData.notes,
  termsConditions: invoiceData.termsConditions,
  currency: 'PKR'
});

export const createGoodsReceivingPDFData = (
  grnData: any,
  companyInfo: CompanyInfo
): PDFGeneratorData => ({
  company: companyInfo,
  recipient: {
    name: grnData.supplierName,
    address: grnData.supplierAddress,
    phone: grnData.supplierPhone,
    email: grnData.supplierEmail
  },
  metadata: {
    documentNumber: grnData.grnNumber,
    documentDate: grnData.receivingDate,
    documentType: 'Goods Receiving Note'
  },
  items: grnData.items.map((item: any) => ({
    name: item.productName,
    sku: item.sku,
    quantity: item.receivingQuantity,
    unitPrice: 0, // GRN doesn't have unit price
    discount: 0,
    taxRate: 0,
    lineTotal: 0, // GRN doesn't have line total
    description: `Ordered: ${item.orderedQuantity} | Received: ${item.receivingQuantity} | Remaining: ${item.remainingQuantity}`
  })),
  totals: {
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0
  },
  notes: grnData.notes,
  termsConditions: '',
  currency: 'PKR'
});
