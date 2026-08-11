'use client';

import { useEffect, useState } from 'react';
import {
  loadPosSettings,
  savePosSettings,
  type PosSettings,
} from '../../../lib/pos-settings';
import {
  attachHidBarcodeScanner,
  connectSerialScanner,
  disconnectSerialScanner,
  isSerialScannerConnected,
  scannerSupportsSerial,
  subscribeBarcodeScans,
} from '../../../lib/pos-scanner';

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '16px',
  padding: '20px',
};
const input = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '9px 14px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};
const btn = (bg: string, c = '#fff') => ({
  padding: '9px 18px',
  borderRadius: '10px',
  border: 'none',
  background: bg,
  color: c,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
});

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>
        <span style={{ display: 'block', fontSize: 14, color: '#fff' }}>{label}</span>
        {hint ? <span style={{ display: 'block', fontSize: 12, color: '#8b8fa8', marginTop: 4 }}>{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function ScannerSettingsTab({ isAdmin }: { isAdmin: boolean }) {
  const [settings, setSettings] = useState<PosSettings>(loadPosSettings());
  const [serialOn, setSerialOn] = useState(isSerialScannerConnected());
  const [serialError, setSerialError] = useState('');
  const [lastTest, setLastTest] = useState('');
  const [testField, setTestField] = useState('');
  const serialOk = scannerSupportsSerial();

  useEffect(() => {
    setSettings(loadPosSettings());
    const off = subscribeBarcodeScans((code) => {
      setLastTest(code);
      setTestField(code);
    });
    const detach = attachHidBarcodeScanner();
    return () => {
      off();
      detach();
    };
  }, []);

  const update = (patch: Partial<PosSettings>) => {
    setSettings(savePosSettings(patch));
  };

  const connect = async () => {
    setSerialError('');
    try {
      await connectSerialScanner(settings.serialBaudRate);
      setSerialOn(true);
    } catch (e: any) {
      setSerialError(e.message || 'Could not connect scanner');
      setSerialOn(false);
    }
  };

  const disconnect = async () => {
    await disconnectSerialScanner();
    setSerialOn(false);
  };

  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 820 }}>
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Hardware barcode scanner</h3>
        <p style={{ margin: 0, color: '#8b8fa8', fontSize: 13, lineHeight: 1.5 }}>
          Plug in a USB barcode scanner (keyboard-wedge / HID). Scan a product barcode on the POS sell screen
          to add it to the cart. Serial/COM scanners can be paired below in Chrome or Edge.
        </p>
        {!isAdmin && (
          <p style={{ color: '#fbbf24', fontSize: 13, marginBottom: 0 }}>View only. Ask an admin to change scanner settings.</p>
        )}

        <Toggle
          label="Enable hardware scanner"
          hint="USB HID scanners work as soon as they are plugged in. No extra driver is required."
          checked={settings.enableBarcodeScanner}
          onChange={(v) => update({ enableBarcodeScanner: v })}
          disabled={!isAdmin}
        />
        <Toggle
          label="Auto-add scanned product to cart"
          hint="If off, the scan only fills the product search box."
          checked={settings.autoAddOnScan}
          onChange={(v) => update({ autoAddOnScan: v })}
          disabled={!isAdmin}
        />
        <Toggle
          label="Beep on successful scan"
          checked={settings.soundOnScan}
          onChange={(v) => update({ soundOnScan: v })}
          disabled={!isAdmin}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8b8fa8' }}>Scan suffix</label>
            <select
              style={input}
              value={settings.scannerSuffix}
              disabled={!isAdmin}
              onChange={(e) => update({ scannerSuffix: e.target.value as 'Enter' | 'Tab' })}
            >
              <option value="Enter">Enter (most USB scanners)</option>
              <option value="Tab">Tab</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8b8fa8' }}>Minimum barcode length</label>
            <input
              type="number"
              min={1}
              max={64}
              style={input}
              disabled={!isAdmin}
              value={settings.scannerMinLength}
              onChange={(e) => update({ scannerMinLength: Math.max(1, Number(e.target.value) || 3) })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8b8fa8' }}>Inter-key timeout (ms)</label>
            <input
              type="number"
              min={20}
              max={400}
              style={input}
              disabled={!isAdmin}
              value={settings.scannerInterKeyMs}
              onChange={(e) => update({ scannerInterKeyMs: Math.max(20, Number(e.target.value) || 80) })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8b8fa8' }}>Optional prefix to strip</label>
            <input
              style={input}
              disabled={!isAdmin}
              value={settings.scannerPrefix}
              placeholder="Leave blank"
              onChange={(e) => update({ scannerPrefix: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Connect serial / COM scanner</h3>
        <p style={{ margin: '0 0 14px', color: '#8b8fa8', fontSize: 13, lineHeight: 1.5 }}>
          Most handheld USB scanners need no pairing — they type the barcode like a keyboard.
          Use this only if your device is a serial scanner (COM port).
        </p>
        {!serialOk && (
          <p style={{ color: '#fbbf24', fontSize: 13 }}>Web Serial needs Chrome or Edge on HTTPS/localhost.</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, color: '#8b8fa8' }}>Baud rate</label>
            <input
              type="number"
              style={input}
              disabled={!isAdmin}
              value={settings.serialBaudRate}
              onChange={(e) => update({ serialBaudRate: Number(e.target.value) || 9600 })}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={!isAdmin || !serialOk || serialOn}
              style={btn(serialOn ? 'rgba(74,222,128,0.25)' : 'linear-gradient(135deg,#014582,#448aff)')}
              onClick={connect}
            >
              {serialOn ? 'Connected' : 'Connect device'}
            </button>
            <button type="button" disabled={!serialOn} style={btn('rgba(239,68,68,0.75)')} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        </div>
        {serialError ? <p style={{ color: '#f87171', fontSize: 13 }}>{serialError}</p> : null}
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Test scan</h3>
        <p style={{ margin: '0 0 12px', color: '#8b8fa8', fontSize: 13 }}>
          Click the box and scan any barcode. The value should appear instantly.
        </p>
        <input
          data-pos-scan="1"
          style={input}
          value={testField}
          placeholder="Click here, then scan..."
          onChange={(e) => setTestField(e.target.value)}
        />
        {lastTest ? (
          <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 0 }}>Last scan: {lastTest}</p>
        ) : null}
      </div>
    </div>
  );
}
