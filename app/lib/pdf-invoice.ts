import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  applyBrandingToCompanyInfo,
  applyBrandedFooters,
  drawBrandedSignature,
  getBrandingAccentRgb,
  type PdfBranding,
} from '../../lib/pdf-branding';

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

const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

function renderPurchaseOrder(
  doc: jsPDF,
  data: PurchaseOrderInvoiceData,
  branding: PdfBranding
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const accent = getBrandingAccentRgb(branding);
  let yPosition = margin;

  const logo = branding.showLogo
    ? branding.logoDataUrl || data.companyLogo
    : undefined;
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, yPosition, 28, 28);
      yPosition += 32;
    } catch (error) {
      console.error('Failed to add company logo:', error);
    }
  }

  const companyName = branding.showCompanyName
    ? branding.companyName || data.companyName || 'Your Company Name'
    : data.companyName || 'Your Company Name';

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(companyName, margin, yPosition);

  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  const address = branding.showAddress
    ? branding.companyAddress || data.companyAddress
    : data.companyAddress;
  if (address) {
    const lines = doc.splitTextToSize(address, contentWidth * 0.55);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 4 + 1;
  }
  if (data.companyPhone) {
    doc.text(`Phone: ${data.companyPhone}`, margin, yPosition);
    yPosition += 5;
  }
  if (data.companyEmail) {
    doc.text(`Email: ${data.companyEmail}`, margin, yPosition);
    yPosition += 5;
  }

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('PURCHASE ORDER', pageWidth - margin, yPosition - 15, { align: 'right' });

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`Order No: ${data.orderNumber}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 6;
  doc.text(`Order Date: ${formatDate(data.orderDate)}`, pageWidth - margin, yPosition, {
    align: 'right',
  });
  if (data.expectedDeliveryDate) {
    yPosition += 6;
    doc.text(
      `Expected Delivery: ${formatDate(data.expectedDeliveryDate)}`,
      pageWidth - margin,
      yPosition,
      { align: 'right' }
    );
  }

  yPosition += 15;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

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

  yPosition += 10;
  const tableData = data.items.map((item) => [
    item.productName || '',
    item.sku || '-',
    item.quantity.toString(),
    formatCurrency(item.unitPrice || 0),
    `${item.discount || 0}%`,
    `${item.taxRate || 0}%`,
    formatCurrency(item.lineTotal || 0),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Item Name', 'SKU', 'Qty', 'Unit Price', 'Discount %', 'Tax %', 'Line Total']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;
  const summaryX = pageWidth - margin - 80;
  const summaryY = yPosition;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(summaryX, summaryY, 80, 80);

  let summaryYPos = summaryY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text('Subtotal:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.subtotal), summaryX + 75, summaryYPos, { align: 'right' });
  summaryYPos += 8;
  doc.text('Discount:', summaryX + 5, summaryYPos);
  doc.setTextColor(200, 0, 0);
  doc.text(`-${formatCurrency(data.totalDiscount)}`, summaryX + 75, summaryYPos, {
    align: 'right',
  });
  doc.setTextColor(0);
  summaryYPos += 8;
  doc.text('Tax:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.totalTax), summaryX + 75, summaryYPos, { align: 'right' });
  summaryYPos += 10;
  doc.line(summaryX + 5, summaryYPos, summaryX + 75, summaryYPos);
  summaryYPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', summaryX + 5, summaryYPos);
  doc.text(formatCurrency(data.grandTotal), summaryX + 75, summaryYPos, { align: 'right' });

  yPosition = summaryY + 90;
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
      yPosition += noteLines.length * 5 + 10;
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
      yPosition += termsLines.length * 5 + 10;
    }
  }

  drawBrandedSignature(doc, branding, yPosition, margin);
  applyBrandedFooters(doc, branding, margin);
}

export const generatePurchaseOrderInvoice = async (
  data: PurchaseOrderInvoiceData
): Promise<void> => {
  const { branding, company } = await applyBrandingToCompanyInfo({
    name: data.companyName,
    address: data.companyAddress,
    logo: data.companyLogo,
    phone: data.companyPhone,
    email: data.companyEmail,
  });
  const doc = new jsPDF();
  renderPurchaseOrder(
    doc,
    {
      ...data,
      companyName: company.name,
      companyAddress: company.address,
      companyLogo: company.logo,
    },
    branding
  );
  doc.save(`Purchase_Order_${data.orderNumber}.pdf`);
};

export const generatePurchaseOrderInvoiceBlob = async (
  data: PurchaseOrderInvoiceData
): Promise<Blob> => {
  const { branding, company } = await applyBrandingToCompanyInfo({
    name: data.companyName,
    address: data.companyAddress,
    logo: data.companyLogo,
    phone: data.companyPhone,
    email: data.companyEmail,
  });
  const doc = new jsPDF();
  renderPurchaseOrder(
    doc,
    {
      ...data,
      companyName: company.name,
      companyAddress: company.address,
      companyLogo: company.logo,
    },
    branding
  );
  return doc.output('blob');
};
