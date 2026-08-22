'use client';

import { useEffect, useState } from 'react';
import {
  loadPosSettings,
  savePosSettings,
  type PosSettings,
} from '../../../lib/pos-settings';
import {
  connectThermalPrinter,
  disconnectThermalPrinter,
  isThermalPrinterConnected,
  printTestThermalPage,
  reconnectThermalPrinter,
  kickCashDrawer,
  thermalPrinterSupportsSerial,
} from '../../../lib/pos-thermal-printer';

const card = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
};
const input = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '9px 14px',
  color: '#0f172a',
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
        borderBottom: '1px solid #e5e7eb',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>
        <span style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>{label}</span>
        {hint ? <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 4 }}>{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function ThermalPrinterTab({ isAdmin }: { isAdmin: boolean }) {
  const [settings, setSettings] = useState<PosSettings>(loadPosSettings());
  const [connected, setConnected] = useState(isThermalPrinterConnected());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const serialOk = thermalPrinterSupportsSerial();

  useEffect(() => {
    setSettings(loadPosSettings());
    void reconnectThermalPrinter().then((ok) => setConnected(ok));
  }, []);

  const patch = (partial: Partial<PosSettings>) => {
    const next = savePosSettings(partial);
    setSettings(next);
    setMessage('Printer settings saved');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleConnect = async () => {
    setBusy(true);
    setError('');
    try {
      await connectThermalPrinter(settings.thermalPrinterBaudRate);
      setConnected(true);
      setMessage('Thermal printer connected');
    } catch (e: any) {
      setError(e?.message || 'Could not connect printer');
      setConnected(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectThermalPrinter();
      setConnected(false);
      setMessage('Printer disconnected');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenDrawer = async () => {
    setBusy(true);
    setError('');
    try {
      await kickCashDrawer();
      setMessage('Drawer open signal sent');
    } catch (e: any) {
      setError(e?.message || 'Could not open drawer');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setError('');
    try {
      if (!isThermalPrinterConnected()) {
        await connectThermalPrinter(settings.thermalPrinterBaudRate);
        setConnected(true);
      }
      await printTestThermalPage();
      setMessage('Test page sent to printer');
    } catch (e: any) {
      setError(e?.message || 'Test print failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, color: '#0f172a' }}>Thermal printer</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
          Print POS receipts on 58mm / 80mm thermal printers. Use browser mode if Windows/macOS already
          shows your printer in the print dialog, or ESC/POS for direct USB-serial printers (Xprinter,
          Rongta, Epson TM, etc.).
        </p>
      </div>

      {message ? (
        <div
          style={{
            background: 'rgba(5,150,105,0.08)',
            border: '1px solid rgba(5,150,105,0.25)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#059669',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          style={{
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#0f172a' }}>Print mode</h3>
        <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
          How should POS print receipts?
        </label>
        <select
          value={settings.thermalPrintMode}
          disabled={!isAdmin}
          onChange={(e) => patch({ thermalPrintMode: e.target.value as 'browser' | 'escpos' })}
          style={{ ...input, marginBottom: 12 }}
        >
          <option value="browser">Browser print dialog (select thermal printer)</option>
          <option value="escpos">ESC/POS direct (Web Serial USB/COM)</option>
        </select>

        <Toggle
          label="Auto-print after sale"
          hint="Opens print / sends ESC/POS automatically when a sale completes"
          checked={settings.autoPrintOnSale}
          disabled={!isAdmin}
          onChange={(v) => patch({ autoPrintOnSale: v })}
        />
        <Toggle
          label="Auto-open cash drawer on cash sale"
          hint="On = cash payment complete hote hi drawer khulegi. Off = sirf Sell screen ke Open drawer button se khulegi."
          checked={settings.openDrawerOnCashSale}
          disabled={!isAdmin}
          onChange={(v) => patch({ openDrawerOnCashSale: v })}
        />
        <Toggle
          label="Cut paper after print (ESC/POS)"
          checked={settings.thermalCutPaper}
          disabled={!isAdmin || settings.thermalPrintMode !== 'escpos'}
          onChange={(v) => patch({ thermalCutPaper: v })}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
              Baud rate (ESC/POS)
            </label>
            <select
              value={settings.thermalPrinterBaudRate}
              disabled={!isAdmin}
              onChange={(e) => patch({ thermalPrinterBaudRate: Number(e.target.value) })}
              style={input}
            >
              {[9600, 19200, 38400, 57600, 115200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
              Feed lines before cut
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.thermalFeedLines}
              disabled={!isAdmin}
              onChange={(e) => patch({ thermalFeedLines: Number(e.target.value) || 4 })}
              style={input}
            />
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b' }}>
          Paper width (58mm / 80mm) is set under the Receipt tab.
        </p>
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#0f172a' }}>ESC/POS connection</h3>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
          Status:{' '}
          <strong style={{ color: connected ? '#059669' : '#64748b' }}>
            {connected ? 'Connected' : 'Not connected'}
          </strong>
          {!serialOk ? ' · Web Serial not available (use Chrome/Edge desktop)' : null}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            style={btn('#014582')}
            disabled={!serialOk || busy || !isAdmin}
            onClick={handleConnect}
          >
            Connect printer
          </button>
          <button
            type="button"
            style={btn('#f1f5f9', '#475569')}
            disabled={!connected || busy}
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
          <button
            type="button"
            style={btn('#0f172a')}
            disabled={!serialOk || busy}
            onClick={handleTest}
          >
            Print test page
          </button>
          <button
            type="button"
            style={btn('#f59e0b')}
            disabled={busy}
            onClick={() => { void handleOpenDrawer(); }}
          >
            Open cash drawer
          </button>
        </div>
        <ol style={{ margin: '16px 0 0', paddingLeft: 18, color: '#64748b', fontSize: 12, lineHeight: 1.7 }}>
          <li>Plug in the thermal printer (USB) and install/OS drivers if using browser mode.</li>
          <li>
            Browser mode: click Print on a sale → choose your thermal printer → set paper to{' '}
            {settings.thermalPaperWidthMm}mm / roll paper, disable headers/footers.
          </li>
          <li>
            ESC/POS mode: click Connect printer, pick the COM/USB serial device, then Print test page.
          </li>
        </ol>
      </div>
    </div>
  );
}
