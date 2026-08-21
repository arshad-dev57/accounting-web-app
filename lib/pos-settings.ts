// lib/pos-settings.ts — POS local settings (receipt, security, hardware)
export type PosSettings = {
  requireManagerForDiscount: boolean;
  discountThresholdPct: number;
  requireManagerForVoid: boolean;
  requireManagerForReturn: boolean;
  loyaltyEnabled: boolean;
  loyaltyPointsPerUnit: number;
  openDrawerOnCashSale: boolean;
  receiptFooter: string;
  receiptHeader: string;
  receiptReturnPolicy: string;
  receiptNotes: string;
  thermalPaperWidthMm: 58 | 80;
  /** browser = Chrome print dialog (select thermal printer). escpos = Web Serial raw ESC/POS */
  thermalPrintMode: 'browser' | 'escpos';
  thermalPrinterBaudRate: number;
  thermalFeedLines: number;
  thermalCutPaper: boolean;
  autoPrintOnSale: boolean;
  enableBarcodeScanner: boolean;
  enableOfflineMode: boolean;
  soundOnScan: boolean;
  autoAddOnScan: boolean;
  scannerSuffix: 'Enter' | 'Tab';
  scannerMinLength: number;
  scannerInterKeyMs: number;
  scannerPrefix: string;
  serialBaudRate: number;
  enablePaymentTerminal: boolean;
  paymentTerminalModel: 'CS30G' | 'Generic ECR';
  paymentTerminalConnection: 'sandbox' | 'serial' | 'network';
  paymentTerminalHost: string;
  paymentTerminalPort: number;
  paymentTerminalBaudRate: number;
  paymentTerminalTimeoutSec: number;
  terminalPaymentMethods: string[];
};

const KEY = 'pos_settings_v1';

export const DEFAULT_POS_SETTINGS: PosSettings = {
  requireManagerForDiscount: true,
  discountThresholdPct: 10,
  requireManagerForVoid: true,
  requireManagerForReturn: true,
  loyaltyEnabled: true,
  loyaltyPointsPerUnit: 1,
  openDrawerOnCashSale: true,
  receiptFooter: 'Thank you for shopping with us! Please visit again.',
  receiptHeader: 'TAX INVOICE / SALES RECEIPT',
  receiptReturnPolicy:
    'Returns accepted within 7 days with this original receipt. Opened, used or clearance items are non-refundable. Please inspect goods before leaving the store.',
  receiptNotes:
    'This is a computer-generated receipt and is valid without a signature. Please retain this copy for warranty, returns and accounting records.',
  thermalPaperWidthMm: 80,
  thermalPrintMode: 'browser',
  thermalPrinterBaudRate: 9600,
  thermalFeedLines: 4,
  thermalCutPaper: true,
  autoPrintOnSale: true,
  enableBarcodeScanner: true,
  enableOfflineMode: true,
  soundOnScan: true,
  autoAddOnScan: true,
  scannerSuffix: 'Enter',
  scannerMinLength: 3,
  scannerInterKeyMs: 80,
  scannerPrefix: '',
  serialBaudRate: 9600,
  enablePaymentTerminal: false,
  paymentTerminalModel: 'CS30G',
  paymentTerminalConnection: 'serial',
  paymentTerminalHost: '192.168.1.100',
  paymentTerminalPort: 8080,
  paymentTerminalBaudRate: 115200,
  paymentTerminalTimeoutSec: 90,
  terminalPaymentMethods: ['Card', 'Mobile Wallet'],
};

export function loadPosSettings(): PosSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_POS_SETTINGS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_POS_SETTINGS };
    return { ...DEFAULT_POS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_POS_SETTINGS };
  }
}

export function savePosSettings(settings: Partial<PosSettings>) {
  const next = { ...loadPosSettings(), ...settings };
  localStorage.setItem(KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pos:settings-changed', { detail: next }));
  }
  return next;
}

export type PosReceiptTemplate = {
  storeName: string;
  storeAddress: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showTaxId: boolean;
  showBarcode: boolean;
  showSku: boolean;
  showLoyalty: boolean;
  showCashier: boolean;
  showTerminal: boolean;
  receiptHeader: string;
  receiptFooter: string;
  receiptReturnPolicy: string;
  receiptNotes: string;
  copyLabel: string;
  servedByPrefix: string;
  poweredBy: string;
  thermalPaperWidthMm: 58 | 80;
};

const RECEIPT_KEY = 'pos_receipt_template_v1';

export const DEFAULT_RECEIPT_TEMPLATE: PosReceiptTemplate = {
  storeName: '',
  storeAddress: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showEmail: true,
  showWebsite: true,
  showTaxId: true,
  showBarcode: true,
  showSku: true,
  showLoyalty: true,
  showCashier: true,
  showTerminal: true,
  receiptHeader: DEFAULT_POS_SETTINGS.receiptHeader,
  receiptFooter: DEFAULT_POS_SETTINGS.receiptFooter,
  receiptReturnPolicy: DEFAULT_POS_SETTINGS.receiptReturnPolicy,
  receiptNotes: DEFAULT_POS_SETTINGS.receiptNotes,
  copyLabel: 'ORIGINAL CUSTOMER COPY',
  servedByPrefix: 'You were served by',
  poweredBy: 'Powered by BisonTechs POS',
  thermalPaperWidthMm: 80,
};

export function loadReceiptTemplate(): PosReceiptTemplate {
  if (typeof window === 'undefined') return { ...DEFAULT_RECEIPT_TEMPLATE };
  try {
    const local = loadPosSettings();
    const raw = localStorage.getItem(RECEIPT_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_RECEIPT_TEMPLATE,
      receiptHeader: local.receiptHeader,
      receiptFooter: local.receiptFooter,
      receiptReturnPolicy: local.receiptReturnPolicy,
      receiptNotes: local.receiptNotes,
      thermalPaperWidthMm: local.thermalPaperWidthMm,
      ...stored,
    };
  } catch {
    return { ...DEFAULT_RECEIPT_TEMPLATE };
  }
}

export function saveReceiptTemplate(template: Partial<PosReceiptTemplate>) {
  const next = { ...loadReceiptTemplate(), ...template };
  localStorage.setItem(RECEIPT_KEY, JSON.stringify(next));
  savePosSettings({
    receiptHeader: next.receiptHeader,
    receiptFooter: next.receiptFooter,
    receiptReturnPolicy: next.receiptReturnPolicy,
    receiptNotes: next.receiptNotes,
    thermalPaperWidthMm: next.thermalPaperWidthMm,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pos:receipt-template-changed', { detail: next }));
  }
  return next;
}

/** Attempt cash-drawer kick via browser print of ESC/POS open-drawer sequence */
export function openCashDrawer() {
  if (typeof window === 'undefined') return;
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    // ESC p m t1 t2 — common drawer pulse; browsers may ignore binary, still useful for compatible print bridges
    const kick = String.fromCharCode(27, 112, 0, 25, 250);
    doc.open();
    doc.write(`<html><body><pre style="font-size:1px;color:white">${kick}</pre><script>window.onload=function(){window.print();}</script></body></html>`);
    doc.close();
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* ignore */
      }
    }, 1500);
  } catch {
    /* ignore */
  }
}

export function playScanBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.start();
    o.stop(ctx.currentTime + 0.08);
  } catch {
    /* ignore */
  }
}
