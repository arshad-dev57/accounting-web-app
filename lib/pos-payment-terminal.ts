import { loadPosSettings } from './pos-settings';

export type TerminalLinkStatus = 'disconnected' | 'connecting' | 'ready' | 'busy' | 'error';

export type TerminalSaleResult = {
  approved: boolean;
  message: string;
  authCode?: string;
  rrn?: string;
  cardLast4?: string;
  entryMode?: string;
  batchNo?: string;
  reference: string;
};

type StatusListener = (status: TerminalLinkStatus, detail?: string) => void;

const statusListeners = new Set<StatusListener>();
let status: TerminalLinkStatus = 'disconnected';
let statusDetail = '';
let serialPort: any = null;
let ws: WebSocket | null = null;
let pending:
  | {
      resolve: (v: TerminalSaleResult) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  | null = null;

export function getPaymentTerminalStatus() {
  return { status, detail: statusDetail };
}

export function subscribePaymentTerminalStatus(fn: StatusListener) {
  statusListeners.add(fn);
  fn(status, statusDetail);
  return () => statusListeners.delete(fn);
}

function setStatus(next: TerminalLinkStatus, detail = '') {
  status = next;
  statusDetail = detail;
  statusListeners.forEach((fn) => fn(next, detail));
}

export function methodNeedsPaymentDevice(method: string) {
  const settings = loadPosSettings();
  if (!settings.enablePaymentTerminal) return false;
  return (settings.terminalPaymentMethods || []).some(
    (m) => m.toLowerCase() === String(method || '').toLowerCase()
  );
}

function encodeEcr(payload: Record<string, unknown>) {
  return `\x02${JSON.stringify(payload)}\x03`;
}

function parseEcrChunk(raw: string): any | null {
  const text = raw.replace(/\u0000/g, '').trim();
  if (!text) return null;
  const stx = text.indexOf('\x02');
  const etx = text.indexOf('\x03');
  const jsonText =
    stx >= 0 && etx > stx ? text.slice(stx + 1, etx) : text.replace(/[\x02\x03]/g, '');
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function normalizeResult(data: any, amount: number): TerminalSaleResult {
  const code = String(
    data?.result || data?.status || data?.respCode || data?.responseCode || ''
  ).toUpperCase();
  const approved =
    data?.approved === true ||
    code === 'APPROVED' ||
    code === '00' ||
    code === 'SUCCESS' ||
    String(data?.hostResponse || '').toUpperCase() === 'APPROVED';
  const pan = String(data?.cardNo || data?.pan || data?.maskedPan || '');
  const cardLast4 = (data?.cardLast4 || pan.replace(/\D/g, '').slice(-4) || '').toString();
  const authCode = String(data?.authCode || data?.approvalCode || data?.auth || '');
  const rrn = String(data?.rrn || data?.retrievalRef || data?.traceNo || '');
  const entryMode = String(data?.entryMode || data?.posEntryMode || data?.cardType || '');
  const parts = [
    authCode ? `AUTH ${authCode}` : null,
    rrn ? `RRN ${rrn}` : null,
    cardLast4 ? `****${cardLast4}` : null,
    entryMode || null,
  ].filter(Boolean);
  return {
    approved,
    message:
      data?.message ||
      data?.hostMessage ||
      (approved ? 'Payment approved on terminal' : 'Payment declined on terminal'),
    authCode: authCode || undefined,
    rrn: rrn || undefined,
    cardLast4: cardLast4 || undefined,
    entryMode: entryMode || undefined,
    batchNo: data?.batchNo ? String(data.batchNo) : undefined,
    reference: parts.join(' · ') || `TERM ${amount.toFixed(2)}`,
  };
}

function buildSalePayload(amount: number, currency: string, invoice?: string) {
  const settings = loadPosSettings();
  const amountMinor = Math.round(amount * 100);
  return {
    command: 'SALE',
    transType: 'SALE',
    device: settings.paymentTerminalModel || 'CS30G',
    amount,
    amountMinor,
    currency: currency || 'USD',
    invoice: invoice || '',
    timestamp: new Date().toISOString(),
  };
}

async function writeSerial(text: string) {
  if (!serialPort?.writable) throw new Error('Payment terminal is not connected');
  const writer = serialPort.writable.getWriter();
  try {
    await writer.write(new TextEncoder().encode(text));
  } finally {
    writer.releaseLock();
  }
}

async function listenSerial() {
  if (!serialPort?.readable) return;
  const decoder = new TextDecoder();
  let leftover = '';
  try {
    while (serialPort.readable && status !== 'disconnected') {
      const reader = serialPort.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          leftover += decoder.decode(value, { stream: true });
          const parsed = parseEcrChunk(leftover);
          if (parsed) {
            leftover = '';
            settlePending(parsed);
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  } catch {
    setStatus('error', 'Terminal connection lost');
  }
}

function settlePending(data: any) {
  if (!pending) return;
  clearTimeout(pending.timer);
  const waiter = pending;
  pending = null;
  setStatus('ready', 'Terminal ready');
  const amount = Number(data?.amount || 0);
  waiter.resolve(normalizeResult(data, amount));
}

function waitForResult(timeoutMs: number) {
  return new Promise<TerminalSaleResult>((resolve, reject) => {
    if (pending) {
      reject(new Error('A payment is already in progress on the terminal'));
      return;
    }
    pending = {
      resolve,
      reject,
      timer: setTimeout(() => {
        pending = null;
        setStatus('ready', 'Terminal ready');
        reject(new Error('Payment terminal timed out. Ask the customer to try again.'));
      }, timeoutMs),
    };
  });
}

export async function connectPaymentTerminal() {
  const settings = loadPosSettings();
  if (!settings.enablePaymentTerminal) {
    setStatus('disconnected', 'Payment device disabled');
    return;
  }
  setStatus('connecting', 'Connecting to payment device…');
  await disconnectPaymentTerminal(false);

  if (settings.paymentTerminalConnection === 'sandbox') {
    setStatus('ready', `${settings.paymentTerminalModel} sandbox ready`);
    return;
  }

  if (settings.paymentTerminalConnection === 'serial') {
    const nav = navigator as Navigator & { serial?: any };
    if (!nav.serial) throw new Error('USB serial needs Chrome or Edge. Plug in the CS30G via USB.');
    const port = await nav.serial.requestPort();
    await port.open({ baudRate: settings.paymentTerminalBaudRate || 115200 });
    serialPort = port;
    setStatus('ready', `${settings.paymentTerminalModel} connected over USB`);
    void listenSerial();
    return;
  }

  const url = `ws://${settings.paymentTerminalHost}:${settings.paymentTerminalPort}`;
  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`Could not reach ${settings.paymentTerminalModel} at ${url}`));
    }, 8000);
    socket.onopen = () => {
      clearTimeout(timer);
      ws = socket;
      setStatus('ready', `${settings.paymentTerminalModel} connected at ${url}`);
      resolve();
    };
    socket.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Could not reach ${settings.paymentTerminalModel} at ${url}`));
    };
    socket.onmessage = (ev) => {
      const parsed = typeof ev.data === 'string' ? parseEcrChunk(ev.data) : null;
      if (parsed) settlePending(parsed);
    };
    socket.onclose = () => {
      if (ws === socket) {
        ws = null;
        if (status !== 'disconnected') setStatus('error', 'Terminal disconnected');
      }
    };
  });
}

export async function reconnectPaymentTerminal() {
  const settings = loadPosSettings();
  if (!settings.enablePaymentTerminal) return false;
  if (settings.paymentTerminalConnection === 'sandbox') {
    setStatus('ready', `${settings.paymentTerminalModel} sandbox ready`);
    return true;
  }
  if (settings.paymentTerminalConnection === 'serial') {
    const nav = navigator as Navigator & { serial?: any };
    if (!nav.serial) return false;
    const ports = await nav.serial.getPorts();
    if (!ports.length) return false;
    const port = ports[0];
    if (!port.readable) await port.open({ baudRate: settings.paymentTerminalBaudRate || 115200 });
    serialPort = port;
    setStatus('ready', `${settings.paymentTerminalModel} connected over USB`);
    void listenSerial();
    return true;
  }
  try {
    await connectPaymentTerminal();
    return true;
  } catch {
    setStatus('disconnected', 'Payment device offline');
    return false;
  }
}

export async function disconnectPaymentTerminal(updateStatus = true) {
  if (pending) {
    clearTimeout(pending.timer);
    pending.reject(new Error('Terminal disconnected'));
    pending = null;
  }
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  ws = null;
  try {
    await serialPort?.close?.();
  } catch {
    /* ignore */
  }
  serialPort = null;
  if (updateStatus) setStatus('disconnected', 'Payment device disconnected');
}

export async function cancelPaymentTerminalSale() {
  const settings = loadPosSettings();
  const payload = encodeEcr({ command: 'CANCEL', transType: 'CANCEL', device: settings.paymentTerminalModel });
  try {
    if (serialPort) await writeSerial(payload);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ command: 'CANCEL', transType: 'CANCEL' }));
  } catch {
    /* ignore */
  }
  if (pending) {
    clearTimeout(pending.timer);
    pending.reject(new Error('Payment cancelled'));
    pending = null;
  }
  setStatus('ready', 'Terminal ready');
}

export async function requestPaymentTerminalSale(opts: {
  amount: number;
  currency?: string;
  invoice?: string;
}): Promise<TerminalSaleResult> {
  const settings = loadPosSettings();
  if (!settings.enablePaymentTerminal) {
    throw new Error('Payment terminal is disabled. Enable it in POS Management.');
  }
  if (status !== 'ready' && settings.paymentTerminalConnection !== 'sandbox') {
    throw new Error('Payment terminal is not connected. Connect the CS30G from POS Management.');
  }

  const amount = Number(opts.amount || 0);
  if (amount <= 0) throw new Error('Enter a valid amount to charge on the terminal');

  const currency =
    opts.currency ||
    (typeof window !== 'undefined'
      ? (JSON.parse(localStorage.getItem('sales_selected_currency') || '{}')?.code
        || localStorage.getItem('app_currency_code'))
      : null) ||
    'USD';

  setStatus('busy', 'Waiting for customer on payment device…');

  if (settings.paymentTerminalConnection === 'sandbox') {
    await new Promise((r) => setTimeout(r, 1800));
    setStatus('ready', `${settings.paymentTerminalModel} sandbox ready`);
    return normalizeResult(
      {
        result: 'APPROVED',
        authCode: String(Math.floor(100000 + Math.random() * 900000)),
        rrn: String(Date.now()).slice(-12),
        cardLast4: '4242',
        entryMode: 'CONTACTLESS',
        amount,
      },
      amount
    );
  }

  const body = buildSalePayload(amount, currency, opts.invoice);
  const timeoutMs = Math.max(15, settings.paymentTerminalTimeoutSec || 90) * 1000;
  const resultPromise = waitForResult(timeoutMs);

  if (settings.paymentTerminalConnection === 'serial') {
    await writeSerial(encodeEcr(body));
  } else if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(body));
  } else {
    const httpUrl = `http://${settings.paymentTerminalHost}:${settings.paymentTerminalPort}/ecr/sale`;
    const res = await fetch(httpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setStatus('ready', 'Terminal ready');
    return normalizeResult(data, amount);
  }

  return resultPromise;
}
