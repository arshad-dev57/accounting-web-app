// lib/pos-scanner.ts — USB HID wedge + Web Serial barcode scanners
import { loadPosSettings, playScanBeep, type PosSettings } from './pos-settings';

type ScanListener = (code: string) => void;

const listeners = new Set<ScanListener>();
let hidRefCount = 0;
let hidCleanup: (() => void) | null = null;
let lastEmitted = { code: '', at: 0 };

let serialPort: { readable?: ReadableStream<Uint8Array>; close?: () => Promise<void>; opened?: boolean } | null = null;
let serialAbort: AbortController | null = null;
let serialConnected = false;

export function subscribeBarcodeScans(listener: ScanListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSerialScannerConnected() {
  return serialConnected;
}

export function emitBarcodeScan(raw: string) {
  const settings = loadPosSettings();
  let code = raw.trim();
  const prefix = (settings.scannerPrefix || '').trim();
  if (prefix && code.startsWith(prefix)) code = code.slice(prefix.length).trim();
  if (code.length < (settings.scannerMinLength || 3)) return;
  const now = Date.now();
  if (code === lastEmitted.code && now - lastEmitted.at < 500) return;
  lastEmitted = { code, at: now };
  listeners.forEach((fn) => fn(code));
}

export function attachHidBarcodeScanner() {
  if (typeof window === 'undefined') return () => {};
  hidRefCount += 1;
  if (hidRefCount > 1 && hidCleanup) {
    return () => {
      hidRefCount = Math.max(0, hidRefCount - 1);
      if (hidRefCount === 0) hidCleanup?.();
    };
  }

  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    const settings = loadPosSettings();
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isScanField = target?.dataset?.posScan === '1';
    if (tag === 'textarea') return;
    if (tag === 'input' && !isScanField && (target as HTMLInputElement).type !== 'search' && (target as HTMLInputElement).type !== 'text') {
      return;
    }

    const suffix = settings.scannerSuffix || 'Enter';
    const isSuffix = e.key === suffix || (suffix === 'Enter' && e.key === 'Enter');

    if (isSuffix) {
      const code = buffer.trim();
      buffer = '';
      if (timer) clearTimeout(timer);
      if (code.length >= (settings.scannerMinLength || 3)) {
        e.preventDefault();
        e.stopPropagation();
        emitBarcodeScan(code);
      }
      return;
    }

    if (e.key.length === 1) {
      buffer += e.key;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        buffer = '';
      }, Math.max(30, settings.scannerInterKeyMs || 80));
    }
  };

  window.addEventListener('keydown', onKeyDown, true);
  hidCleanup = () => {
    window.removeEventListener('keydown', onKeyDown, true);
    hidCleanup = null;
    hidRefCount = 0;
  };
  return () => {
    hidRefCount = Math.max(0, hidRefCount - 1);
    if (hidRefCount === 0) hidCleanup?.();
  };
}

async function readSerialLoop(port: any) {
  const decoder = new TextDecoder();
  let leftover = '';
  serialAbort = new AbortController();
  try {
    while (port.readable && serialConnected) {
      const reader = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          leftover += decoder.decode(value, { stream: true });
          leftover = leftover.replace(/\r/g, '\n');
          const parts = leftover.split('\n');
          leftover = parts.pop() || '';
          for (const part of parts) {
            const code = part.trim();
            if (code) emitBarcodeScan(code);
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  } catch {
    serialConnected = false;
  }
}

export async function connectSerialScanner(baudRate?: number) {
  const nav = navigator as Navigator & { serial?: any };
  if (!nav.serial) {
    throw new Error('Web Serial is not supported in this browser. Use Chrome or Edge, or plug in a USB HID scanner.');
  }
  await disconnectSerialScanner();
  const port = await nav.serial.requestPort();
  await port.open({ baudRate: baudRate || loadPosSettings().serialBaudRate || 9600 });
  serialPort = port;
  serialConnected = true;
  void readSerialLoop(port);
  return true;
}

export async function reconnectSerialScanner(baudRate?: number) {
  const nav = navigator as Navigator & { serial?: any };
  if (!nav.serial || serialConnected) return serialConnected;
  const ports = await nav.serial.getPorts();
  if (!ports.length) return false;
  const port = ports[0];
  if (!port.readable) {
    await port.open({ baudRate: baudRate || loadPosSettings().serialBaudRate || 9600 });
  }
  serialPort = port;
  serialConnected = true;
  void readSerialLoop(port);
  return true;
}

export async function disconnectSerialScanner() {
  serialConnected = false;
  serialAbort?.abort();
  serialAbort = null;
  try {
    await serialPort?.close?.();
  } catch {
    /* already closed */
  }
  serialPort = null;
}

export function scannerSupportsSerial() {
  return typeof navigator !== 'undefined' && !!(navigator as Navigator & { serial?: unknown }).serial;
}

export function matchScannedProduct(list: any[], code: string) {
  const needle = code.trim().toLowerCase();
  return (
    list.find((p) => String(p.barcodeNumber || p.barcode?.number || '').trim().toLowerCase() === needle) ||
    list.find((p) => String(p.sku || '').trim().toLowerCase() === needle) ||
    null
  );
}

export function beepIfEnabled(settings?: PosSettings) {
  const cfg = settings || loadPosSettings();
  if (cfg.soundOnScan) playScanBeep();
}
