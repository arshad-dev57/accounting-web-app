import JsBarcode from 'jsbarcode';
import { loadCurrencyLocal } from './currency-service';
import {
  loadPosSettings,
  loadReceiptTemplate,
  type PosReceiptTemplate,
  type PosSettings,
} from './pos-settings';

export type PosReceiptCompany = {
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  country: string;
};

export type PosReceiptSale = {
  invoiceNumber?: string;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  grandTotal?: number;
  paidAmount?: number;
  changeAmount?: number;
  notes?: string;
  status?: string;
  items?: Array<{
    productName?: string;
    sku?: string;
    barcodeNumber?: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number;
    taxRate?: number;
    taxAmount?: number;
    lineTotal?: number;
  }>;
  payments?: Array<{
    paymentMethod?: string;
    amount?: number;
    reference?: string;
  }>;
  cashierName?: string;
  terminalName?: string;
  terminalCode?: string;
  shift?: {
    cashier?: { firstName?: string; lastName?: string };
    terminal?: { name?: string; code?: string };
  };
  cashier?: { firstName?: string; lastName?: string };
  terminal?: { name?: string; code?: string };
};

export function money(amount?: number | null) {
  const { symbol } = loadCurrencyLocal();
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
  return `${symbol} ${formatted}`;
}

function readLocalCompanyFallback() {
  if (typeof window === 'undefined') {
    return { name: '', logo: '', address: '' };
  }
  try {
    const brandingRaw = localStorage.getItem('bisonstechs_company_branding');
    const branding = brandingRaw ? JSON.parse(brandingRaw) : {};
    const pdfRaw = localStorage.getItem('pdf_report_settings');
    const pdf = pdfRaw ? JSON.parse(pdfRaw) : {};
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    const bd = user?.businessDetails || {};
    return {
      name:
        branding.organizationName ||
        pdf.companyName ||
        user.organizationName ||
        '',
      logo: branding.logo || pdf.logo || bd.logo || '',
      address: pdf.companyAddress || user.address || '',
    };
  } catch {
    return { name: '', logo: '', address: '' };
  }
}

function resolveAssetUrl(path: string) {
  if (!path) return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('/')
  ) {
    return path;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiBase) return `${apiBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  return `/${path.replace(/^\//, '')}`;
}

export function resolveReceiptCompany(
  profile: any,
  template?: PosReceiptTemplate
): PosReceiptCompany {
  const bd = profile?.businessDetails || {};
  const company = profile?.company || {};
  const tpl = template || loadReceiptTemplate();
  const local = readLocalCompanyFallback();
  const name =
    tpl.storeName ||
    profile?.organizationName ||
    company.name ||
    local.name ||
    'Bisonstechs';
  const logo =
    bd.logo ||
    company.logo ||
    profile?.logo ||
    local.logo ||
    '/bisontechs.png';

  return {
    name,
    logo: resolveAssetUrl(logo),
    address:
      tpl.storeAddress ||
      [profile?.address || company.address, profile?.country].filter(Boolean).join(', ') ||
      local.address,
    phone: tpl.phone || profile?.contactNo || company.phone || profile?.phone || '',
    email: tpl.email || company.email || '',
    website: tpl.website || profile?.websiteLink || company.website || '',
    taxId: tpl.taxId || bd.taxRegistrationNumber || company.taxRegistrationNumber || '',
    country: profile?.country || '',
  };
}

export function sampleReceiptSale(): PosReceiptSale {
  return {
    invoiceNumber: 'INV-000123',
    createdAt: new Date().toISOString(),
    customerName: 'Walk-in Customer',
    customerPhone: '0300-0000000',
    customerEmail: 'customer@email.com',
    items: [
      {
        productName: 'Sample Product',
        sku: 'SKU-001',
        barcodeNumber: '1234567890123',
        quantity: 2,
        unitPrice: 50,
        discount: 0,
        taxRate: 17,
        taxAmount: 17,
        lineTotal: 117,
      },
    ],
    payments: [{ paymentMethod: 'Cash', amount: 120, reference: '' }],
    subtotal: 100,
    discountTotal: 0,
    taxTotal: 17,
    grandTotal: 117,
    paidAmount: 120,
    changeAmount: 3,
    cashierName: 'Ahmed Khan',
    terminalName: 'Front Counter',
    terminalCode: 'TERM-01',
    status: 'Completed',
  };
}

export function resolveReceiptMeta(sale: PosReceiptSale, shift?: any) {
  const cashier =
    sale.cashierName ||
    [sale.cashier?.firstName, sale.cashier?.lastName].filter(Boolean).join(' ') ||
    [sale.shift?.cashier?.firstName, sale.shift?.cashier?.lastName].filter(Boolean).join(' ') ||
    [shift?.cashier?.firstName, shift?.cashier?.lastName].filter(Boolean).join(' ') ||
    '';
  const terminal =
    sale.terminalName ||
    sale.terminal?.name ||
    sale.shift?.terminal?.name ||
    shift?.terminal?.name ||
    '';
  const terminalCode =
    sale.terminalCode ||
    sale.terminal?.code ||
    sale.shift?.terminal?.code ||
    shift?.terminal?.code ||
    '';
  return { cashier, terminal, terminalCode };
}

export function itemCount(sale: PosReceiptSale) {
  return (sale.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export function loyaltyPoints(sale: PosReceiptSale, settings: PosSettings) {
  if (!settings.loyaltyEnabled || !sale.customerId) return 0;
  const perUnit = settings.loyaltyPointsPerUnit || 1;
  return Math.max(0, Math.floor(Number(sale.grandTotal) || 0) * perUnit);
}

export function receiptBarcodeValue(sale: PosReceiptSale) {
  return String(sale.invoiceNumber || 'RECEIPT').replace(/\s+/g, '');
}

export function renderBarcodeSvg(value: string, svg: SVGSVGElement) {
  try {
    JsBarcode(svg, value, {
      format: 'CODE128',
      width: 1.5,
      height: 46,
      displayValue: true,
      fontSize: 11,
      margin: 0,
      background: '#ffffff',
      lineColor: '#111827',
      fontOptions: 'bold',
    });
  } catch {
    /* ignore invalid barcode values */
  }
}

export function barcodePngDataUrl(value: string): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, {
      format: 'CODE128',
      width: 2,
      height: 56,
      displayValue: true,
      fontSize: 14,
      margin: 8,
      background: '#ffffff',
      lineColor: '#111827',
    });
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function printReceiptNode(node: HTMLElement, widthMm: 58 | 80 = 80) {
  const win = window.open('', 'pos-receipt', 'width=480,height=800');
  if (!win) {
    window.print();
    return;
  }

  const clone = node.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('/')) img.setAttribute('src', `${window.location.origin}${src}`);
  });

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt</title>
  <style>
    @page { size: ${widthMm}mm auto; margin: 4mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111827;
    }
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
    }
    .pos-receipt-paper {
      margin: 0 auto !important;
    }
    img { max-width: 160px; height: auto; display: block; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`);
  win.document.close();

  const printWhenReady = () => {
    win.focus();
    win.print();
    win.close();
  };

  const images = Array.from(win.document.images);
  if (!images.length) {
    setTimeout(printWhenReady, 200);
    return;
  }
  let remaining = images.length;
  const done = () => {
    remaining -= 1;
    if (remaining <= 0) setTimeout(printWhenReady, 150);
  };
  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.onload = done;
      img.onerror = done;
    }
  });
}

export async function downloadPosReceiptPdf(opts: {
  sale: PosReceiptSale;
  company: PosReceiptCompany;
  shift?: any;
  settings?: PosSettings;
}) {
  const { default: jsPDF } = await import('jspdf');
  const sale = opts.sale;
  const company = opts.company;
  const settings = opts.settings || loadPosSettings();
  const template = loadReceiptTemplate();
  const meta = resolveReceiptMeta(sale, opts.shift);
  const width = template.thermalPaperWidthMm || settings.thermalPaperWidthMm || 80;
  const invoice = sale.invoiceNumber || 'RECEIPT';
  const items = sale.items || [];
  const payments = sale.payments || [];
  const estimatedHeight = Math.max(200, 110 + items.length * 14 + payments.length * 8);
  const doc = new jsPDF({ unit: 'mm', format: [width, estimatedHeight] });
  const inner = width - 8;
  let y = 6;
  const center = (text: string, size = 9, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('courier', style);
    doc.setFontSize(size);
    doc.text(text, width / 2, y, { align: 'center', maxWidth: inner });
    y += size * 0.45 + 1.6;
  };
  const line = (left: string, right: string, size = 8, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('courier', style);
    doc.setFontSize(size);
    doc.text(left, 4, y);
    doc.text(right, width - 4, y, { align: 'right' });
    y += 4.2;
  };
  const dash = () => {
    doc.setDrawColor(180);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(4, y, width - 4, y);
    doc.setLineDashPattern([], 0);
    y += 3.5;
  };

  if (company.logo && template.showLogo) {
    try {
      doc.addImage(company.logo, 'PNG', width / 2 - 10, y, 20, 16);
      y += 18;
    } catch {
      /* logo may not be a data URL */
    }
  }

  doc.setTextColor(17, 24, 39);
  center(company.name.toUpperCase(), 11, 'bold');
  if (template.showAddress && company.address) center(company.address, 7);
  if (template.showPhone && company.phone) center(`Tel: ${company.phone}`, 7);
  if (template.showEmail && company.email) center(company.email, 7);
  if (template.showWebsite && company.website) center(company.website.replace(/^https?:\/\//, ''), 7);
  if (template.showTaxId && company.taxId) center(`NTN / Tax ID: ${company.taxId}`, 7, 'bold');
  y += 1;
  dash();
  center(template.receiptHeader || settings.receiptHeader || 'TAX INVOICE / SALES RECEIPT', 9, 'bold');
  center(template.copyLabel || 'ORIGINAL CUSTOMER COPY', 7);
  dash();
  line('Receipt #', invoice, 8, 'bold');
  line('Date', new Date(sale.createdAt || Date.now()).toLocaleString());
  if (template.showTerminal && meta.terminal) line('Terminal', meta.terminalCode ? `${meta.terminal} (${meta.terminalCode})` : meta.terminal);
  if (template.showCashier && meta.cashier) line('Cashier', meta.cashier);
  line('Customer', sale.customerName || 'Walk-in Customer');
  if (sale.customerPhone) line('Phone', sale.customerPhone);
  if (sale.customerEmail) line('Email', sale.customerEmail);
  dash();
  line('ITEM', 'AMOUNT', 7, 'bold');
  items.forEach((item) => {
    const name = item.productName || 'Item';
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    const wrapped = doc.splitTextToSize(name, inner - 2);
    wrapped.forEach((row: string) => {
      doc.text(row, 4, y);
      y += 3.6;
    });
    if (item.sku) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text(`SKU: ${item.sku}`, 4, y);
      y += 3.4;
    }
    const qtyLine = `${item.quantity || 0} x ${money(item.unitPrice)}`;
    const extras = [
      item.discount ? `Disc ${item.discount}%` : '',
      item.taxRate ? `Tax ${item.taxRate}%` : '',
    ].filter(Boolean).join(' · ');
    line(extras ? `${qtyLine}  ${extras}` : qtyLine, money(item.lineTotal), 7);
  });
  dash();
  line('Items', String(itemCount(sale)));
  line('Subtotal', money(sale.subtotal));
  if (Number(sale.discountTotal) > 0) line('Discount', `-${money(sale.discountTotal)}`);
  if (Number(sale.taxTotal) > 0) line('Tax', money(sale.taxTotal));
  dash();
  line('TOTAL', money(sale.grandTotal), 11, 'bold');
  dash();
  payments.forEach((pmt) => {
    const label = pmt.reference ? `${pmt.paymentMethod} (${pmt.reference})` : pmt.paymentMethod || 'Payment';
    line(label || 'Payment', money(pmt.amount));
  });
  line('Paid', money(sale.paidAmount), 8, 'bold');
  if (Number(sale.changeAmount) > 0) line('Change', money(sale.changeAmount));
  const points = loyaltyPoints(sale, settings);
  if (template.showLoyalty && points > 0) line('Loyalty pts earned', String(points));
  dash();

  if (template.showBarcode) {
    const barcode = barcodePngDataUrl(receiptBarcodeValue(sale));
    if (barcode) {
      const barcodeW = Math.min(inner, 62);
      doc.addImage(barcode, 'PNG', (width - barcodeW) / 2, y, barcodeW, 18);
      y += 22;
    }
    center('Scan barcode to look up this receipt', 6);
  }
  dash();
  if (template.receiptReturnPolicy) {
    const policy = doc.splitTextToSize(template.receiptReturnPolicy, inner);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    policy.forEach((row: string) => {
      doc.text(row, width / 2, y, { align: 'center' });
      y += 3.2;
    });
    y += 1;
  }
  if (template.receiptNotes) {
    const notes = doc.splitTextToSize(template.receiptNotes, inner);
    notes.forEach((row: string) => {
      doc.text(row, width / 2, y, { align: 'center' });
      y += 3.2;
    });
    y += 1;
  }
  center(template.receiptFooter || 'Thank you for shopping with us!', 8, 'bold');
  center(`Generated ${new Date().toLocaleString()}`, 6);
  center(template.poweredBy || 'Powered by BisonTechs POS', 6);

  doc.save(`receipt_${invoice}.pdf`);
}
