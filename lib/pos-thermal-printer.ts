/**
 * POS thermal printer — ESC/POS (Web Serial) + browser thermal print fallback.
 * USB/Serial: Xprinter, Rongta, Epson TM, Black Copper / clones.
 */
import {
  loadPosSettings,
  loadReceiptTemplate,
  getDrawerPulse,
  type PosSettings,
} from './pos-settings';
import {
  itemCount,
  money,
  printReceiptNode,
  receiptBarcodeValue,
  receiptQrValue,
  resolveReceiptCompany,
  resolveReceiptMeta,
  type PosReceiptSale,
} from './pos-receipt';

type SerialPortLike = {
  open: (opts: {
    baudRate: number;
    flowControl?: 'none' | 'hardware';
    bufferSize?: number;
  }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};

declare global {
  interface Navigator {
    serial?: {
      requestPort: () => Promise<SerialPortLike>;
      getPorts: () => Promise<SerialPortLike[]>;
    };
  }
}

let printerPort: SerialPortLike | null = null;
let printerConnected = false;

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export function thermalPrinterSupportsSerial() {
  return typeof navigator !== 'undefined' && !!navigator.serial;
}

export function isThermalPrinterConnected() {
  return printerConnected;
}

function encodeText(text: string): Uint8Array {
  const normalized = String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const out = new Uint8Array(normalized.length);
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized.charCodeAt(i);
    out[i] = c < 256 ? c : 0x3f;
  }
  return out;
}

function concat(...parts: Uint8Array[]) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function bytes(...nums: number[]) {
  return new Uint8Array(nums);
}

function charsPerLine(widthMm: 58 | 80) {
  return widthMm === 58 ? 32 : 48;
}

function dashLine(width: number) {
  return '-'.repeat(Math.max(8, width));
}

function padLine(left: string, right: string, width: number) {
  const l = String(left || '');
  const r = String(right || '');
  const space = Math.max(1, width - l.length - r.length);
  return `${l}${' '.repeat(space)}${r}`.slice(0, width);
}

function wrapText(text: string, width: number): string[] {
  const raw = String(text || '');
  if (!raw) return [''];
  const words = raw.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      if (w.length <= width) cur = w;
      else {
        for (let i = 0; i < w.length; i += width) lines.push(w.slice(i, i + width));
        cur = '';
      }
      continue;
    }
    if (cur.length + 1 + w.length <= width) cur = `${cur} ${w}`;
    else {
      lines.push(cur);
      cur = w.length <= width ? w : '';
      if (w.length > width) {
        for (let i = 0; i < w.length; i += width) lines.push(w.slice(i, i + width));
      }
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

class EscPosBuilder {
  private chunks: Uint8Array[] = [];

  raw(...nums: number[]) {
    this.chunks.push(bytes(...nums));
    return this;
  }

  text(s: string) {
    this.chunks.push(encodeText(s));
    return this;
  }

  line(s = '') {
    this.text(s);
    this.raw(LF);
    return this;
  }

  init() {
    this.raw(ESC, 0x40);
    this.raw(LF);
    this.dark();
    return this;
  }

  dark() {
    this.raw(ESC, 0x47, 1);
    this.raw(GS, 0x28, 0x4b, 2, 0, 49, 8);
    this.raw(ESC, 0x37, 7, 140, 2);
    return this;
  }

  align(mode: 'left' | 'center' | 'right') {
    const n = mode === 'center' ? 1 : mode === 'right' ? 2 : 0;
    return this.raw(ESC, 0x61, n);
  }

  bold(on: boolean) {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }

  size(width: 1 | 2 = 1, height: 1 | 2 = 1) {
    const n = ((width - 1) << 4) | (height - 1);
    return this.raw(GS, 0x21, n);
  }

  cut() {
    this.raw(GS, 0x56, 0x41, 0x00);
    this.raw(GS, 0x56, 0x00);
    return this;
  }

  feed(n = 4) {
    return this.raw(ESC, 0x64, Math.min(20, Math.max(0, n)));
  }

  drawer() {
    const { t1, t2 } = getDrawerPulse();
    return this.raw(ESC, 0x70, 0x00, t1, t2).raw(ESC, 0x70, 0x01, t1, t2);
  }

  barcode(value: string) {
    const payload = `{B${String(value || 'RECEIPT').slice(0, 38)}`;
    const data = encodeText(payload);
    this.raw(GS, 0x68, 70);
    this.raw(GS, 0x77, 3);
    this.raw(GS, 0x48, 2);
    this.raw(GS, 0x66, 0);
    this.raw(GS, 0x6b, 73, data.length);
    this.chunks.push(data);
    this.raw(LF);
    return this;
  }

  qr(value: string, moduleSize = 5) {
    const data = encodeText(value);
    const storeLen = data.length + 3;
    this.raw(GS, 0x28, 0x6b, 4, 0, 49, 65, 50, 0);
    this.raw(GS, 0x28, 0x6b, 3, 0, 49, 67, Math.min(8, Math.max(3, moduleSize)));
    this.raw(GS, 0x28, 0x6b, 3, 0, 49, 69, 50);
    this.raw(GS, 0x28, 0x6b, storeLen & 0xff, storeLen >> 8, 49, 80, 48);
    this.chunks.push(data);
    this.raw(GS, 0x28, 0x6b, 3, 0, 49, 81, 48);
    this.raw(LF);
    return this;
  }

  build() {
    return concat(...this.chunks);
  }
}

export function saleHasCashPayment(sale: PosReceiptSale) {
  const methods = (sale.payments || []).map((p) => String(p.paymentMethod || '').toLowerCase());
  if (methods.some((m) => m.includes('cash'))) return true;
  return methods.length === 0;
}

export function buildEscPosReceipt(opts: {
  sale: PosReceiptSale;
  companyProfile?: any;
  shift?: any;
  settings?: PosSettings;
  kickDrawer?: boolean;
}): Uint8Array {
  const settings = opts.settings || loadPosSettings();
  const tpl = loadReceiptTemplate();
  const widthMm = (tpl.thermalPaperWidthMm || settings.thermalPaperWidthMm || 80) as 58 | 80;
  const cols = charsPerLine(widthMm);
  const company = resolveReceiptCompany(opts.companyProfile, tpl);
  const meta = resolveReceiptMeta(opts.sale, opts.shift);
  const sale = opts.sale;
  const invoice = sale.invoiceNumber || 'RECEIPT';
  const soldAt = new Date(sale.createdAt || Date.now());
  const items = sale.items || [];
  const payments = sale.payments || [];
  const b = new EscPosBuilder();

  b.init();
  b.align('center');
  b.bold(true);
  b.size(2, 2);
  for (const row of wrapText(company.name || 'STORE', Math.floor(cols / 2))) b.line(row);
  b.size(1, 1);
  b.bold(true);
  if (tpl.showAddress && company.address) wrapText(company.address, cols).forEach((r) => b.line(r));
  if (tpl.showPhone && company.phone) b.line(`Tel: ${company.phone}`);
  if (tpl.showEmail && company.email) b.line(company.email);
  if (tpl.showWebsite && company.website) b.line(company.website.replace(/^https?:\/\//, ''));
  if (tpl.showTaxId && company.taxId) b.line(`NTN: ${company.taxId}`);
  b.line(dashLine(cols));
  b.line(tpl.receiptHeader || 'TAX INVOICE / SALES RECEIPT');
  b.bold(false);
  if (tpl.copyLabel) b.line(tpl.copyLabel);
  b.line(dashLine(cols));

  b.align('left');
  b.bold(true);
  b.line(padLine('Receipt #', invoice, cols));
  b.bold(false);
  b.line(padLine('Date', soldAt.toLocaleDateString(), cols));
  b.line(padLine('Time', soldAt.toLocaleTimeString(), cols));
  if (tpl.showTerminal && meta.terminal) {
    const term = meta.terminalCode ? `${meta.terminal} (${meta.terminalCode})` : meta.terminal;
    b.line(padLine('Terminal', term.slice(0, cols - 10), cols));
  }
  if (tpl.showCashier && meta.cashier) b.line(padLine('Cashier', meta.cashier.slice(0, cols - 10), cols));
  if (sale.status) b.line(padLine('Status', String(sale.status), cols));

  b.line(dashLine(cols));
  b.bold(true);
  b.line('BILL TO');
  b.bold(false);
  b.line(sale.customerName || 'Walk-in Customer');
  if (sale.customerPhone) b.line(`Phone: ${sale.customerPhone}`);

  b.line(dashLine(cols));
  b.bold(true);
  b.line(padLine('ITEM', 'AMOUNT', cols));
  b.bold(false);
  b.line(dashLine(cols));

  items.forEach((item) => {
    b.bold(true);
    wrapText(String(item.productName || 'Item').toUpperCase(), cols).forEach((r) => b.line(r));
    b.bold(false);
    if (tpl.showSku) {
      const skuBits = [item.sku ? `SKU ${item.sku}` : '', item.barcodeNumber || ''].filter(Boolean).join(' · ');
      if (skuBits) wrapText(skuBits, cols).forEach((r) => b.line(r));
    }
    const qtyBits = [
      `${item.quantity || 0} x ${money(item.unitPrice)}`,
      item.discount ? `Disc ${item.discount}%` : '',
      item.taxRate ? `Tax ${item.taxRate}%` : '',
    ]
      .filter(Boolean)
      .join('  ');
    b.line(padLine(qtyBits.slice(0, cols - 10), money(item.lineTotal), cols));
  });

  b.line(dashLine(cols));
  b.line(padLine('Items', String(itemCount(sale)), cols));
  b.line(padLine('Subtotal', money(sale.subtotal), cols));
  if (Number(sale.discountTotal) > 0) b.line(padLine('Discount', `-${money(sale.discountTotal)}`, cols));
  if (Number(sale.taxTotal) > 0) b.line(padLine('Tax', money(sale.taxTotal), cols));
  b.line(dashLine(cols));
  b.bold(true);
  b.size(2, 2);
  b.line(padLine('TOTAL', money(sale.grandTotal), Math.floor(cols / 2)));
  b.size(1, 1);
  b.bold(false);
  b.line(dashLine(cols));

  b.bold(true);
  b.line('PAYMENT');
  b.bold(false);
  if (payments.length) {
    payments.forEach((p) => {
      const label = p.reference ? `${p.paymentMethod} ${p.reference}` : p.paymentMethod || 'Payment';
      b.line(padLine(String(label).slice(0, cols - 10), money(p.amount), cols));
    });
  }
  b.line(padLine('Paid', money(sale.paidAmount), cols));
  if (Number(sale.changeAmount) > 0) b.line(padLine('Change', money(sale.changeAmount), cols));
  if (sale.notes) {
    b.line(dashLine(cols));
    wrapText(`Notes: ${sale.notes}`, cols).forEach((r) => b.line(r));
  }

  if (tpl.showBarcode) {
    b.line(dashLine(cols));
    b.align('center');
    try {
      b.barcode(receiptBarcodeValue(sale));
    } catch {
      b.line(receiptBarcodeValue(sale));
    }
    try {
      const qrPayload = receiptQrValue(sale, opts.shift);
      b.qr(qrPayload.length > 400 ? receiptBarcodeValue(sale) : qrPayload, widthMm === 58 ? 4 : 5);
    } catch {
      /* older printers may skip QR */
    }
    b.line('Scan for receipt details');
  }

  b.align('center');
  b.line(dashLine(cols));
  if (tpl.receiptReturnPolicy) wrapText(tpl.receiptReturnPolicy, cols).forEach((r) => b.line(r));
  if (tpl.receiptNotes) wrapText(tpl.receiptNotes, cols).forEach((r) => b.line(r));
  b.bold(true);
  b.line(tpl.receiptFooter || 'Thank you!');
  b.bold(false);
  if (tpl.servedByPrefix && meta.cashier) b.line(`${tpl.servedByPrefix} ${meta.cashier}`);
  if (tpl.poweredBy) b.line(tpl.poweredBy);
  b.line(new Date().toLocaleString());

  b.feed(settings.thermalFeedLines ?? 6);
  if (settings.thermalCutPaper !== false) b.cut();

  const shouldKick =
    opts.kickDrawer !== false &&
    settings.openDrawerOnCashSale !== false &&
    saleHasCashPayment(sale);
  if (shouldKick) b.drawer();

  return b.build();
}

async function writeToPort(data: Uint8Array) {
  if (!printerPort?.writable) throw new Error('Thermal printer is not connected');
  const writer = printerPort.writable.getWriter();
  try {
    const chunk = 512;
    for (let i = 0; i < data.length; i += chunk) {
      await writer.write(data.slice(i, i + chunk));
      if (i + chunk < data.length) {
        await new Promise((r) => setTimeout(r, 20));
      }
    }
  } finally {
    writer.releaseLock();
  }
}

export async function connectThermalPrinter(baudRate?: number) {
  if (!thermalPrinterSupportsSerial()) {
    throw new Error('Web Serial is not supported in this browser. Use Chrome/Edge on desktop.');
  }
  const settings = loadPosSettings();
  const port = await navigator.serial!.requestPort();
  try {
    await port.open({
      baudRate: baudRate || settings.thermalPrinterBaudRate || 9600,
      flowControl: 'none',
      bufferSize: 255,
    });
    printerPort = port;
    printerConnected = true;
    return true;
  } catch (e: any) {
    if (e?.name === 'InvalidStateError' || String(e?.message || '').toLowerCase().includes('already open')) {
      printerPort = port;
      printerConnected = true;
      return true;
    }
    throw e;
  }
}

export async function reconnectThermalPrinter() {
  if (!thermalPrinterSupportsSerial()) return false;
  if (printerConnected && printerPort) return true;

  const settings = loadPosSettings();
  const ports = await navigator.serial!.getPorts();
  if (!ports.length) return false;
  const port = ports[0];

  try {
    await port.open({
      baudRate: settings.thermalPrinterBaudRate || 9600,
      flowControl: 'none',
      bufferSize: 255,
    });
    printerPort = port;
    printerConnected = true;
    return true;
  } catch (e: any) {
    if (String(e?.message || '').toLowerCase().includes('already open') || e?.name === 'InvalidStateError') {
      printerPort = port;
      printerConnected = true;
      return true;
    }
    printerPort = null;
    printerConnected = false;
    return false;
  }
}

export async function disconnectThermalPrinter() {
  try {
    await printerPort?.close();
  } catch {
    /* ignore */
  }
  printerPort = null;
  printerConnected = false;
}

export async function kickCashDrawer() {
  const payload = new EscPosBuilder().init().drawer().build();

  const send = async () => {
    if (!printerConnected || !printerPort?.writable) {
      const ok = await reconnectThermalPrinter();
      if (!ok || !printerPort?.writable) {
        throw new Error(
          'Connect the thermal printer first (POS Management → Printer → Connect printer), then try Open cash drawer again.'
        );
      }
    }
    await writeToPort(payload);
  };

  try {
    await send();
    return { ok: true as const, mode: 'escpos' as const };
  } catch (first) {
    printerConnected = false;
    printerPort = null;
    try {
      await send();
      return { ok: true as const, mode: 'escpos' as const };
    } catch {
      throw first instanceof Error
        ? first
        : new Error(
            'Connect the thermal printer first (POS Management → Printer → Connect printer), then try Open cash drawer again.'
          );
    }
  }
}

async function maybeOpenDrawer(sale: PosReceiptSale) {
  const settings = loadPosSettings();
  if (settings.openDrawerOnCashSale === false) return;
  if (!saleHasCashPayment(sale)) return;
  try {
    await kickCashDrawer();
  } catch {
    /* drawer only works when the printer is connected over ESC/POS */
  }
}

export async function printEscPosReceipt(opts: {
  sale: PosReceiptSale;
  companyProfile?: any;
  shift?: any;
}) {
  if (!printerConnected || !printerPort) {
    const reconnected = await reconnectThermalPrinter();
    if (!reconnected) throw new Error('Connect the thermal printer first (POS Management → Printer)');
  }
  await writeToPort(buildEscPosReceipt(opts));
}

export async function printTestThermalPage() {
  const settings = loadPosSettings();
  const tpl = loadReceiptTemplate();
  const cols = charsPerLine(tpl.thermalPaperWidthMm || 80);
  const b = new EscPosBuilder();

  b.init();
  b.align('center');
  b.bold(true);
  b.size(2, 2);
  b.line('PRINTER TEST');
  b.size(1, 1);
  b.line('DARK TEXT CHECK');
  b.bold(false);
  b.line(dashLine(cols));
  b.line('BisonTechs POS');
  b.line(`${tpl.thermalPaperWidthMm || 80}mm thermal`);
  b.line(new Date().toLocaleString());
  b.line(dashLine(cols));
  b.barcode('TEST-12345');
  b.qr('POS-TEST', 5);
  b.line('If you can read this, ESC/POS works.');
  b.feed(settings.thermalFeedLines ?? 6);
  if (settings.thermalCutPaper !== false) b.cut();
  if (!printerConnected || !printerPort?.writable) {
    const ok = await reconnectThermalPrinter();
    if (!ok) throw new Error('Connect the thermal printer first (POS Management → Printer)');
  }
  await writeToPort(b.build());
}

export async function printPosReceipt(opts: {
  sale: PosReceiptSale;
  companyProfile?: any;
  shift?: any;
  paperNode?: HTMLElement | null;
  forceMode?: 'browser' | 'escpos';
}) {
  const settings = loadPosSettings();
  const tpl = loadReceiptTemplate();
  const widthMm = (tpl.thermalPaperWidthMm || settings.thermalPaperWidthMm || 80) as 58 | 80;
  const mode = opts.forceMode || settings.thermalPrintMode || 'browser';

  if (mode === 'escpos') {
    try {
      await printEscPosReceipt(opts);
      return { mode: 'escpos' as const };
    } catch (e) {
      if (opts.paperNode) {
        printReceiptNode(opts.paperNode, widthMm);
        await maybeOpenDrawer(opts.sale);
        return { mode: 'browser' as const, fallback: true, error: e };
      }
      throw e;
    }
  }

  if (opts.paperNode) {
    printReceiptNode(opts.paperNode, widthMm);
  } else {
    throw new Error('Receipt paper is not ready for browser print');
  }

  await maybeOpenDrawer(opts.sale);
  return { mode: 'browser' as const };
}
