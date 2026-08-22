'use client';

import { useEffect, useRef } from 'react';
import { productService } from '../app/api/product/route';
import {
  attachHidBarcodeScanner,
  beepIfEnabled,
  matchScannedProduct,
  subscribeBarcodeScans,
} from './pos-scanner';

/** Same USB HID scanner as POS. Call onScan with the barcode string. */
export function useHardwareBarcodeScanner(
  onScan: (code: string) => void,
  enabled = true
) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    const detach = attachHidBarcodeScanner();
    const unsub = subscribeBarcodeScans((code) => {
      onScanRef.current(code);
    });
    return () => {
      unsub();
      detach();
    };
  }, [enabled]);
}

export async function findProductFromScan(code: string, locationId?: string) {
  const trimmed = code.trim();
  if (!trimmed) return null;
  try {
    const product = await productService.getProductByBarcode(trimmed);
    if (product) {
      beepIfEnabled();
      return product;
    }
  } catch {
    /* fall through to search */
  }
  try {
    const result = await productService.getProducts({
      search: trimmed,
      limit: 12,
      locationId: locationId || undefined,
    });
    const list = result.data || [];
    const match = matchScannedProduct(list, trimmed) || (list.length === 1 ? list[0] : null);
    if (match) beepIfEnabled();
    return match;
  } catch {
    return null;
  }
}
