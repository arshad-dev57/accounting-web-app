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
  const apiBase = process.env.API_URL || '';
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

/** Short CODE128 value — invoice only so bars stay thick and scannable on thermal paper. */
export function receiptBarcodeValue(sale: PosReceiptSale) {
  return String(sale.invoiceNumber || 'RECEIPT')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9\-_./]/g, '')
    .slice(0, 32) || 'RECEIPT';
}

/** Compact receipt payload for QR (short keys, truncated names — denser codes fail on thermal). */
export function buildReceiptQrPayload(sale: PosReceiptSale, shift?: any) {
  const meta = resolveReceiptMeta(sale, shift);
  const when = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const items = (sale.items || []).slice(0, 25).map((item) => ({
    n: String(item.productName || 'Item').slice(0, 28),
    s: item.sku ? String(item.sku).slice(0, 16) : undefined,
    b: item.barcodeNumber ? String(item.barcodeNumber).slice(0, 20) : undefined,
    q: Number(item.quantity) || 0,
    u: Number(item.unitPrice) || 0,
    d: Number(item.discount) || 0,
    t: Number(item.taxRate) || 0,
    l: Number(item.lineTotal) || 0,
  }));
  const payments = (sale.payments || []).map((p) => ({
    m: String(p.paymentMethod || 'Cash').slice(0, 16),
    a: Number(p.amount) || 0,
    r: p.reference ? String(p.reference).slice(0, 24) : undefined,
  }));

  return {
    v: 1,
    typ: 'POS',
    inv: sale.invoiceNumber || '',
    st: sale.status || 'Completed',
    dt: when.toISOString().slice(0, 19),
    cust: String(sale.customerName || 'Walk-in').slice(0, 40),
    ph: sale.customerPhone ? String(sale.customerPhone).slice(0, 20) : undefined,
    em: sale.customerEmail ? String(sale.customerEmail).slice(0, 40) : undefined,
    term: String(meta.terminalCode || meta.terminal || '').slice(0, 20) || undefined,
    cash: meta.cashier ? String(meta.cashier).slice(0, 30) : undefined,
    it: items,
    n: itemCount(sale),
    sub: Number(sale.subtotal) || 0,
    disc: Number(sale.discountTotal) || 0,
    tax: Number(sale.taxTotal) || 0,
    tot: Number(sale.grandTotal) || 0,
    paid: Number(sale.paidAmount) || 0,
    chg: Number(sale.changeAmount) || 0,
    pay: payments,
    note: sale.notes ? String(sale.notes).slice(0, 80) : undefined,
  };
}

export function receiptQrValue(sale: PosReceiptSale, shift?: any) {
  return JSON.stringify(buildReceiptQrPayload(sale, shift));
}

const BARCODE_OPTS = {
  format: 'CODE128' as const,
  width: 2.4,
  height: 64,
  displayValue: true,
  fontSize: 13,
  textMargin: 4,
  margin: 14,
  background: '#ffffff',
  lineColor: '#000000',
};

export function renderBarcodeSvg(value: string, svg: SVGSVGElement) {
  try {
    JsBarcode(svg, value, BARCODE_OPTS);
  } catch {
    /* ignore invalid barcode values */
  }
}

export function barcodePngDataUrl(value: string): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, {
      ...BARCODE_OPTS,
      width: 2.6,
      height: 70,
      margin: 16,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

const QR_OPTS = {
  errorCorrectionLevel: 'Q' as const,
  margin: 3,
  color: { dark: '#000000', light: '#ffffff' },
};

export async function receiptQrPngDataUrl(
  sale: PosReceiptSale,
  shift?: any,
  size = 280
): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(receiptQrValue(sale, shift), {
      ...QR_OPTS,
      width: size,
    });
  } catch {
    return '';
  }
}

export async function renderReceiptQrCanvas(
  sale: PosReceiptSale,
  canvas: HTMLCanvasElement,
  shift?: any
) {
  try {
    const QRCode = (await import('qrcode')).default;
    await QRCode.toCanvas(canvas, receiptQrValue(sale, shift), {
      ...QR_OPTS,
      width: 220,
    });
  } catch {
    /* ignore */
  }
}

export function printReceiptNode(node: HTMLElement, widthMm: 58 | 80 = 80) {
  if (typeof document === 'undefined') {
    throw new Error('Cannot print - document not available');
  }

  // Find the actual receipt paper element if node is a wrapper
  const receiptPaper = node.querySelector('.pos-receipt-paper') || node;

  // Clone the receipt node
  const clone = receiptPaper.cloneNode(true) as HTMLElement;

  // Fix relative image URLs to absolute
  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('/')) {
      img.setAttribute('src', `${window.location.origin}${src}`);
    }
  });

  // Convert canvas elements to images (for QR/barcode)
  const sourceCanvases = Array.from(receiptPaper.querySelectorAll('canvas'));
  clone.querySelectorAll('canvas').forEach((canvasEl, idx) => {
    const source = sourceCanvases[idx] as HTMLCanvasElement | undefined;
    if (!source) return;
    try {
      const img = document.createElement('img');
      img.src = source.toDataURL('image/png');
      img.className = 'receipt-qr';
      canvasEl.replaceWith(img);
    } catch {
      /* ignore */
    }
  });

  const paperPx = widthMm === 58 ? 220 : 302;

  // Hidden iframe — only receipt content inside, nothing else
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'POS thermal print');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;

  if (!win || !doc) {
    try { document.body.removeChild(iframe); } catch { /* ignore */ }
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt</title>
  <style>
    @page {
      size: ${widthMm}mm auto;
      margin: 0;
    }
    @media print {
      @page {
        size: ${widthMm}mm auto;
        margin: 0;
      }
      body {
        width: ${widthMm}mm !important;
        max-width: ${widthMm}mm !important;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: ${widthMm}mm;
      max-width: ${widthMm}mm;
      background: #fff;
      color: #000;
    }
    body {
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      line-height: 1.4;
    }
    .pos-receipt-paper {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto;
      padding: 4px 6px;
      background: #fff;
    }
    .no-print { display: none !important; }
    img.company-logo {
      max-width: ${widthMm === 58 ? 110 : 150}px;
      height: auto;
      display: block;
      margin: 0 auto 6px;
    }
    img.receipt-qr {
      width: ${widthMm === 58 ? 120 : 160}px;
      height: ${widthMm === 58 ? 120 : 160}px;
      image-rendering: pixelated;
      display: block;
      margin: 6px auto;
    }
    table { width: 100%; border-collapse: collapse; }
    svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 4px auto;
    }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`);
  doc.close();

  let printed = false;

  const cleanup = () => {
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* ignore */ }
    }, 3000);
  };

  const printWhenReady = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      window.print();
    } finally {
      cleanup();
    }
  };

  const images = Array.from(doc.images);
  if (!images.length) {
    setTimeout(printWhenReady, 300);
    return;
  }

  let remaining = images.length;
  const done = () => {
    remaining -= 1;
    if (remaining <= 0) setTimeout(printWhenReady, 200);
  };
  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.onload = done;
      img.onerror = done;
    }
  });

  // Force print after 4s even if images stall
  setTimeout(() => { if (!printed) printWhenReady(); }, 4000);
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
      const barcodeW = Math.min(inner, 72);
      doc.addImage(barcode, 'PNG', (width - barcodeW) / 2, y, barcodeW, 22);
      y += 26;
    }
    const qr = await receiptQrPngDataUrl(sale, undefined, 360);
    if (qr) {
      const qrSize = Math.min(48, inner);
      doc.addImage(qr, 'PNG', (width - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 4;
    }
    center('Barcode = receipt #  ·  QR = sale details', 6);
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