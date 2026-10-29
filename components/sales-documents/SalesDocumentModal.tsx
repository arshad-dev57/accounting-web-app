'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileDown, Image as ImageIcon, Loader2, MessageCircle, Printer, X } from 'lucide-react';
import { SalesDocumentSheet } from './SalesDocumentSheet';
import { WhatsAppShareModal, type GeneratedFile } from './WhatsAppShareModal';
import { loadPdfBranding, type PdfBranding } from '@/lib/pdf-branding';
import { loadCompanyContactInfo, type CompanyContactInfo } from '@/lib/company-contact';
import type { SalesDocument } from '@/lib/sales-document';
import { addressText, dateLabel } from '@/lib/customer-account';
import { customerService } from '@/api/customer/route';
import { useCurrency } from '@/lib/currency-context';

const FILE_LABEL: Record<SalesDocument['kind'], string> = {
  order: 'Sales-Order',
  delivery: 'Delivery-Note',
  invoice: 'Sales-Invoice',
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.replace(/^data:[^;]*;base64,/, ''));
    };
    reader.onerror = () => reject(new Error('Failed to read generated file'));
    reader.readAsDataURL(blob);
  });
}

export function SalesDocumentModal({
  document: initialDocument,
  onClose,
}: {
  document: SalesDocument;
  onClose: () => void;
}) {
  const { formatAmount } = useCurrency();
  const [document, setDocument] = useState<SalesDocument>(initialDocument);
  const [branding, setBranding] = useState<PdfBranding | null>(null);
  const [companyContact, setCompanyContact] = useState<CompanyContactInfo | null>(null);
  const [exporting, setExporting] = useState<'print' | 'pdf' | 'jpeg' | null>(null);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const customerId = initialDocument.customerId;

  useEffect(() => {
    loadPdfBranding()
      .then((value) => setBranding(value))
      .catch(() => setBranding(null));
    loadCompanyContactInfo()
      .then((value) => setCompanyContact(value))
      .catch(() => setCompanyContact(null));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!customerId) return;
    if (initialDocument.party.email && initialDocument.party.billingAddress) return;
    let cancelled = false;
    customerService
      .getCustomerById(customerId)
      .then((customer) => {
        if (cancelled) return;
        setDocument((prev) => ({
          ...prev,
          party: {
            ...prev.party,
            accountNumber: prev.party.accountNumber || customer.customerNumber,
            email: prev.party.email || customer.email,
            phone: prev.party.phone || customer.phone,
            company: prev.party.company || customer.company || customer.companyName,
            taxId: prev.party.taxId || customer.taxId,
            billingAddress:
              prev.party.billingAddress ||
              addressText(customer.billingAddress || customer.address) ||
              undefined,
            shippingAddress:
              prev.party.shippingAddress || addressText(customer.shippingAddress) || undefined,
          },
        }));
      })
      .catch(() => {
        /* party details optional */
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, initialDocument.party.billingAddress, initialDocument.party.email]);

  const handlePrint = async () => {
    if (!sheetRef.current) return;
    setExporting('print');
    try {
      const win = window.open('', '_blank', 'width=900,height=1200');
      if (!win) return;
      const clone = sheetRef.current.cloneNode(true) as HTMLElement;
      clone.querySelector('[data-sheet-measure]')?.remove();
      win.document.open();
      win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${document.title} ${document.number}</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  img { max-width: 100%; }
  [data-sheet-page] {
    margin: 0 !important;
    page-break-after: always;
    page-break-inside: avoid;
  }
  [data-sheet-page]:last-child { page-break-after: auto; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
</style>
</head>
<body>${clone.outerHTML}</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 600);
    } finally {
      setTimeout(() => setExporting(null), 600);
    }
  };

  const generateJpegPages = async (): Promise<{ dataUrl: string; filename: string }[]> => {
    if (!sheetRef.current) throw new Error('Report preview is not ready');
    const pages = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>('[data-sheet-page]')
    );
    if (!pages.length) throw new Error('Report preview is not ready');
    const html2canvas = (await import('html2canvas')).default;
    const results: { dataUrl: string; filename: string }[] = [];
    for (let index = 0; index < pages.length; index++) {
      const canvas = await html2canvas(pages[index], {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const filename =
        pages.length === 1
          ? `${FILE_LABEL[document.kind]}-${document.number}.jpg`
          : `${FILE_LABEL[document.kind]}-${document.number}-Page-${index + 1}.jpg`;
      results.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.95), filename });
    }
    return results;
  };

  const handleJpeg = async () => {
    setExporting('jpeg');
    try {
      const pages = await generateJpegPages();
      pages.forEach((page, index) => {
        const link = window.document.createElement('a');
        link.href = page.dataUrl;
        link.download = page.filename;
        window.document.body.appendChild(link);
        setTimeout(() => {
          link.click();
          link.remove();
        }, index * 350);
      });
    } catch (err: any) {
      alert(err?.message || 'JPEG export failed');
    } finally {
      setExporting(null);
    }
  };

  const generatePdfBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    const { createBrandedReport, getBrandingAccentRgb } = await import('@/lib/pdf-branding');
    const autoTable = (await import('jspdf-autotable')).default;
    const {
      doc: pdf,
      branding: activeBranding,
      margin,
      startY,
      accentHex,
      pageWidth,
      pageHeight,
      finalize,
    } = await createBrandedReport({ reportTitle: document.title });
    const accentRgb = getBrandingAccentRgb(activeBranding);
    const money = (value: number) => formatAmount(Number(value) || 0);
    const invoiceStyle = document.kind !== 'delivery';

    let y = startY;

    // Company contact + tax registration under the branded header.
    const contactParts = [
      companyContact?.phone ? `Tel: ${companyContact.phone}` : '',
      companyContact?.email ? `Email: ${companyContact.email}` : '',
      companyContact?.website || '',
    ].filter(Boolean);
    if (companyContact?.taxRegistrationNumber) {
      contactParts.push(`Tax Reg. #: ${companyContact.taxRegistrationNumber}`);
    }
    if (contactParts.length) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(pdf.splitTextToSize(contactParts.join('   •   '), pageWidth - margin * 2), margin, y);
      y += 4.5;
    }

    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text(document.party.name, margin, y);
    y += 4.5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    const contact = [
      document.party.accountNumber,
      document.party.company,
      document.party.phone,
      document.party.email,
      document.party.billingAddress,
    ]
      .filter(Boolean)
      .join('  •  ');
    if (contact) {
      const lines = pdf.splitTextToSize(contact, pageWidth - margin * 2 - 70);
      pdf.text(lines, margin, y);
      y += lines.length * 3.6;
    }

    const detailLine = [
      `No: ${document.number}`,
      `Date: ${document.date ? dateLabel(document.date) : '—'}`,
      `Status: ${document.status}`,
      document.paymentStatus ? `Payment: ${document.paymentStatus}` : '',
    ]
      .filter(Boolean)
      .join('   ');
    pdf.setTextColor(51, 65, 85);
    pdf.text(detailLine, margin, y);
    y += 4;
    const metaLine = document.meta.map((row) => `${row.label}: ${row.value}`).join('   ');
    if (metaLine) {
      const lines = pdf.splitTextToSize(metaLine, pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += lines.length * 3.6;
    }
    y += 4;

    const head = invoiceStyle
      ? [['#', 'Description', 'SKU', 'Qty', 'Rate', 'Disc', 'Tax', 'Amount']]
      : [['#', 'Description', 'SKU', 'Unit', 'Ordered', 'Delivered', 'Remaining']];
    const body = document.items.length
      ? document.items.map((item, index) =>
          invoiceStyle
            ? [
                String(index + 1),
                item.description,
                item.sku || '—',
                String(item.quantity || 0),
                money(Number(item.rate) || 0),
                item.discount ? `${item.discount}%` : '—',
                item.taxRate ? `${item.taxRate}%` : '—',
                money(Number(item.amount) || 0),
              ]
            : [
                String(index + 1),
                item.description,
                item.sku || '—',
                item.unit || '—',
                String(item.orderedQuantity || 0),
                String(item.deliveredQuantity || 0),
                String(item.remainingQuantity || 0),
              ]
        )
      : [new Array(head[0].length).fill('')];

    autoTable(pdf, {
      startY: y,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: accentHex, textColor: '#ffffff', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.8 },
      columnStyles: invoiceStyle
        ? {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
          }
        : {
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
          },
      margin: { left: margin, right: margin },
    });
    y = ((pdf as any).lastAutoTable?.finalY || y) + 8;

    const labelX = pageWidth - margin - 48;
    const valueX = pageWidth - margin;
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }
    document.totals.forEach((row) => {
      pdf.setFont('helvetica', row.emphasize ? 'bold' : 'normal');
      pdf.setFontSize(row.emphasize ? 9.5 : 8.5);
      if (row.emphasize) {
        pdf.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      } else {
        pdf.setTextColor(51, 65, 85);
      }
      pdf.text(row.label, labelX, y, { align: 'right' });
      pdf.text(
        row.format === 'quantity' ? String(row.value) : money(row.value),
        valueX,
        y,
        { align: 'right' }
      );
      y += 5;
    });
    y += 3;

    if (document.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Notes', margin, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.text(pdf.splitTextToSize(document.notes, pageWidth - margin * 2), margin, y);
      y += 6;
    }
    if (document.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Terms & Conditions', margin, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.text(pdf.splitTextToSize(document.terms, pageWidth - margin * 2), margin, y);
      y += 6;
    }

    finalize({
      signatureY: Math.min(Math.max(y + 6, 220), pageHeight - 40),
    });

    const filename = `${FILE_LABEL[document.kind]}-${document.number}.pdf`;
    return { blob: pdf.output('blob'), filename };
  };

  const handlePdf = async () => {
    setExporting('pdf');
    try {
      const { blob, filename } = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err: any) {
      alert(err?.message || 'PDF export failed');
    } finally {
      setExporting(null);
    }
  };

  const generateWhatsAppFiles = async (format: 'pdf' | 'jpeg'): Promise<GeneratedFile[]> => {
    if (format === 'pdf') {
      const { blob, filename } = await generatePdfBlob();
      return [
        {
          base64: await blobToBase64(blob),
          filename,
          mimeType: 'application/pdf',
        },
      ];
    }
    const pages = await generateJpegPages();
    return pages.map((page) => ({
      base64: page.dataUrl.replace(/^data:image\/jpeg;base64,/, ''),
      filename: page.filename,
      mimeType: 'image/jpeg',
    }));
  };

  const disabled = exporting !== null;
  const canWhatsApp = document.kind === 'order' && !!document.recordId;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[920px] max-h-[94vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {document.title} — {document.number}
            </h3>
            <p className="text-[11px] text-gray-500">
              {document.party.name} · {document.status}
              {document.paymentStatus ? ` · ${document.paymentStatus}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={disabled}
              className="px-3 py-1.5 bg-[#014582] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
            >
              <Printer className="w-3.5 h-3.5" />
              {exporting === 'print' ? 'Preparing…' : 'Print A4'}
            </button>
            <button
              onClick={handlePdf}
              disabled={disabled}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
            >
              {exporting === 'pdf' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              {exporting === 'pdf' ? 'Generating…' : 'PDF'}
            </button>
            <button
              onClick={handleJpeg}
              disabled={disabled}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
            >
              {exporting === 'jpeg' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              JPEG
            </button>
            {canWhatsApp ? (
              <button
                onClick={() => setWhatsAppOpen(true)}
                disabled={disabled}
                className="px-3 py-1.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/40 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto bg-gray-200/60 p-4">
          <div className="shadow-2xl" style={{ width: '210mm', margin: '0 auto' }}>
            <SalesDocumentSheet
              ref={sheetRef}
              doc={document}
              branding={branding}
              companyContact={companyContact}
            />
          </div>
        </div>
      </div>

      {whatsAppOpen ? (
        <WhatsAppShareModal
          document={document}
          companyName={branding?.companyName?.trim() || 'BisonsTechs'}
          generateFiles={generateWhatsAppFiles}
          onClose={() => setWhatsAppOpen(false)}
        />
      ) : null}
    </div>,
    window.document.body
  );
}
