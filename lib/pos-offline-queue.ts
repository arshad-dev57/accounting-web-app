// lib/pos-offline-queue.ts — Offline POS sale queue (localStorage)
const KEY = 'pos_offline_queue_v1';

export type OfflineSalePayload = {
  id: string;
  terminalId: string;
  customerId?: string | null;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: unknown[];
  payments: unknown[];
  discountTotal?: number;
  taxTotal?: number;
  notes?: string;
  isOffline: true;
  offlineCreatedAt: string;
};

function read(): OfflineSalePayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineSalePayload[]) : [];
  } catch {
    return [];
  }
}

function write(items: OfflineSalePayload[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const posOfflineQueue = {
  list: () => read(),
  count: () => read().length,
  enqueue: (payload: OfflineSalePayload) => {
    const q = read();
    q.push(payload);
    write(q);
    return q.length;
  },
  remove: (id: string) => {
    write(read().filter((x) => x.id !== id));
  },
  clear: () => write([]),
};

export function newOfflineSaleId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
