import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseOrderInvoiceData {
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  notes?: string;
  termsConditions?: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    lineTotal: number;
  }>;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
}

export const generatePurchaseOrderInvoice = (data: PurchaseOrderInvoiceData): void => {
  const doc = new jsPDF();
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // ─── HEADER ────────────────────────────────────────────────
  
  // Company Logo (if provided)
  if (data.companyLogo) {
    try {
      doc.addImage(data.companyLogo, 'PNG', margin, yPosition, 30, 30);
      yPosition += 35;
    } catch (error) {
      console.error('Failed to add company logo:', error);
    }
  }
  
  // Company Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'Your Company Name', margin, yPosition);
  
  // Company details
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  if (data.companyAddress) {
    doc.text(data.companyAddress, margin, yPosition);
    yPosition += 5;
  }
  if (data.companyPhone) {
    doc.text(`Phone: ${data.companyPhone}`, margin, yPosition);
    yPosition += 5;
  }
  if (data.companyEmail) {
    doc.text(`Email: ${data.companyEmail}`, margin, yPosition);
    yPosition += 5;
  }
  
  // Invoice title on the right
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('PURCHASE ORDER', pageWidth - margin, yPosition - 15, { align: 'right' });
  
  // Order number and date
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order No: ${data.orderNumber}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 6;
  doc.text(`Order Date: ${formatDate(data.orderDate)}`, pageWidth - margin, yPosition, { align: 'right' });
  if (data.expectedDeliveryDate) {
    yPosition += 6;
    doc.text(`Expected Delivery: ${formatDate(data.expectedDeliveryDate)}`, pageWidth - margin, yPosition, { align: 'right' });
  }
  
  // ─── HORIZONTAL LINE ───────────────────────────────────────
  yPosition += 15;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // ─── SUPPLIER INFORMATION ───────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Bill To:', margin, yPosition);
  
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(data.supplierName, margin, yPosition);
  yPosition += 5;
  if (data.supplierAddress) {
    doc.text(data.supplierAddress, margin, yPosition);
    yPosition += 5;
  }
  if (data.supplierPhone) {
    doc.text(`Phone: ${data.supplierPhone}`, margin, yPosition);
    yPosition += 5;
  }
  if (data.supplierEmail) {
    doc.text(`Email: ${data.supplierEmail}`, margin, yPosition);
    yPosition += 5;
  }
  
  // ─── ITEMS TABLE ───────────────────────────────────────────
  yPosition += 10;
  
  const tableData = data.items.map(item => [
    item.productName,
    item.sku,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    `${item.discount}%`,
    `${item.taxRate}%`,
    formatCurrency(item.lineTotal)
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Product Name', 'SKU', 'Qty', 'Unit Price', 'Discount %', 'Tax %', 'Line Total']],
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
      0: { cellWidth: 'auto' }, // Product Name
      1: { cellWidth: 25, halign: 'center' }, // SKU
      2: { cellWidth: 20, halign: 'center' }, // Qty
      3: { cellWidth: 30, halign: 'right' }, // Unit Price
      4: { cellWidth: 25, halign: 'center' }, // Discount
      5: { cellWidth: 25, halign: 'center' }, // Tax
      6: { cellWidth: 35, halign: 'right' } // Line Total
    },
    margin: { left: margin, right: margin }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // ─── SUMMARY SECTION ────────────────────────────────────────
  
  // Summary box on the right
  const summaryX = pageWidth - margin - 80;
  const summaryY = yPosition;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(summaryX, summaryY, 80, 80);
  
  let summaryYPos = summaryY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.subtotal), summaryX + 75, summaryYPos, { align: 'right' });
  
  summaryYPos += 8;
  doc.text('Discount:', summaryX + 5, summaryYPos);
  doc.setTextColor(200, 0, 0);
  doc.text(`-${formatCurrency(data.totalDiscount)}`, summaryX + 75, summaryYPos, { align: 'right' });
  doc.setTextColor(0);
  
  summaryYPos += 8;
  doc.text('Tax:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.totalTax), summaryX + 75, summaryYPos, { align: 'right' });
  
  summaryYPos += 10;
  doc.setDrawColor(0);
  doc.line(summaryX + 5, summaryYPos, summaryX + 75, summaryYPos);
  
  summaryYPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.grandTotal), summaryX + 75, summaryYPos, { align: 'right' });
  
  yPosition = summaryY + 90;
  
  // ─── NOTES & TERMS ─────────────────────────────────────────
  if (data.notes || data.termsConditions) {
    yPosition += 10;
    
    if (data.notes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      const noteLines = doc.splitTextToSize(data.notes, contentWidth);
      doc.text(noteLines, margin, yPosition);
      yPosition += (noteLines.length * 5) + 10;
    }
    
    if (data.termsConditions) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Terms & Conditions:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      const termsLines = doc.splitTextToSize(data.termsConditions, contentWidth);
      doc.text(termsLines, margin, yPosition);
      yPosition += (termsLines.length * 5) + 10;
    }
  }
  
  // ─── FOOTER ─────────────────────────────────────────────────
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  doc.text('This is a computer-generated purchase order. No signature required.', pageWidth / 2, yPosition, { align: 'center' });
  
  // ─── SAVE PDF ───────────────────────────────────────────────
  doc.save(`Purchase_Order_${data.orderNumber}.pdf`);
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Function to generate PDF as blob (for email attachment)
export const generatePurchaseOrderInvoiceBlob = (data: PurchaseOrderInvoiceData): Blob => {
  const doc = new jsPDF();
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // ─── HEADER ────────────────────────────────────────────────
  
  // Company Logo (if provided)
  if (data.companyLogo) {
    try {
      doc.addImage(data.companyLogo, 'PNG', margin, yPosition, 30, 30);
      yPosition += 35;
    } catch (error) {
      console.error('Failed to add company logo:', error);
    }
  }
  
  // Company Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'Your Company Name', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  if (data.companyAddress) {
    doc.text(data.companyAddress, margin, yPosition);
    yPosition += 5;
  }
  if (data.companyPhone) {
    doc.text(`Phone: ${data.companyPhone}`, margin, yPosition);
    yPosition += 5;
  }
  if (data.companyEmail) {
    doc.text(`Email: ${data.companyEmail}`, margin, yPosition);
    yPosition += 5;
  }
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('PURCHASE ORDER', pageWidth - margin, yPosition - 15, { align: 'right' });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order No: ${data.orderNumber}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 6;
  doc.text(`Order Date: ${formatDate(data.orderDate)}`, pageWidth - margin, yPosition, { align: 'right' });
  if (data.expectedDeliveryDate) {
    yPosition += 6;
    doc.text(`Expected Delivery: ${formatDate(data.expectedDeliveryDate)}`, pageWidth - margin, yPosition, { align: 'right' });
  }
  
  yPosition += 15;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // ─── SUPPLIER INFORMATION ───────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Bill To:', margin, yPosition);
  
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(data.supplierName, margin, yPosition);
  yPosition += 5;
  if (data.supplierAddress) {
    doc.text(data.supplierAddress, margin, yPosition);
    yPosition += 5;
  }
  if (data.supplierPhone) {
    doc.text(`Phone: ${data.supplierPhone}`, margin, yPosition);
    yPosition += 5;
  }
  if (data.supplierEmail) {
    doc.text(`Email: ${data.supplierEmail}`, margin, yPosition);
    yPosition += 5;
  }
  
  // ─── ITEMS TABLE ───────────────────────────────────────────
  yPosition += 10;
  
  const tableData = data.items.map(item => [
    item.productName,
    item.sku,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    `${item.discount}%`,
    `${item.taxRate}%`,
    formatCurrency(item.lineTotal)
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Product Name', 'SKU', 'Qty', 'Unit Price', 'Discount %', 'Tax %', 'Line Total']],
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
    margin: { left: margin, right: margin }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // ─── SUMMARY SECTION ────────────────────────────────────────
  const summaryX = pageWidth - margin - 80;
  const summaryY = yPosition;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(summaryX, summaryY, 80, 80);
  
  let summaryYPos = summaryY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.subtotal), summaryX + 75, summaryYPos, { align: 'right' });
  
  summaryYPos += 8;
  doc.text('Discount:', summaryX + 5, summaryYPos);
  doc.setTextColor(200, 0, 0);
  doc.text(`-${formatCurrency(data.totalDiscount)}`, summaryX + 75, summaryYPos, { align: 'right' });
  doc.setTextColor(0);
  
  summaryYPos += 8;
  doc.text('Tax:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.totalTax), summaryX + 75, summaryYPos, { align: 'right' });
  
  summaryYPos += 10;
  doc.setDrawColor(0);
  doc.line(summaryX + 5, summaryYPos, summaryX + 75, summaryYPos);
  
  summaryYPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.grandTotal), summaryX + 75, summaryYPos, { align: 'right' });
  
  yPosition = summaryY + 90;
  
  // ─── NOTES & TERMS ─────────────────────────────────────────
  if (data.notes || data.termsConditions) {
    yPosition += 10;
    
    if (data.notes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      const noteLines = doc.splitTextToSize(data.notes, contentWidth);
      doc.text(noteLines, margin, yPosition);
      yPosition += (noteLines.length * 5) + 10;
    }
    
    if (data.termsConditions) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Terms & Conditions:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      const termsLines = doc.splitTextToSize(data.termsConditions, contentWidth);
      doc.text(termsLines, margin, yPosition);
      yPosition += (termsLines.length * 5) + 10;
    }
  }
  
  // ─── FOOTER ─────────────────────────────────────────────────
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  doc.text('This is a computer-generated purchase order. No signature required.', pageWidth / 2, yPosition, { align: 'center' });
  
  // Return as blob
  return doc.output('blob');
};
