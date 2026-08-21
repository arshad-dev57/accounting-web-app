'use client';

import { useEffect, useState } from 'react';
import {
  loadPosSettings,
  savePosSettings,
  type PosSettings,
} from '../../../lib/pos-settings';
import {
  connectPaymentTerminal,
  disconnectPaymentTerminal,
  getPaymentTerminalStatus,
  subscribePaymentTerminalStatus,
  type TerminalLinkStatus,
} from '../../../lib/pos-payment-terminal';

const METHODS = ['Card', 'Mobile Wallet', 'Bank Transfer'];

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
  outline: 'none' as const,
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

export default function PaymentTerminalTab({ isAdmin }: { isAdmin: boolean }) {
  const [settings, setSettings] = useState<PosSettings>(loadPosSettings());
  const [status, setStatus] = useState<TerminalLinkStatus>(getPaymentTerminalStatus().status);
  const [detail, setDetail] = useState(getPaymentTerminalStatus().detail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSettings(loadPosSettings());
    return subscribePaymentTerminalStatus((next, info) => {
      setStatus(next);
      setDetail(info || '');
    });
  }, []);

  const update = (patch: Partial<PosSettings>) => {
    setSettings(savePosSettings(patch));
  };

  const toggleMethod = (method: string, on: boolean) => {
    const current = settings.terminalPaymentMethods || [];
    const next = on ? Array.from(new Set([...current, method])) : current.filter((m) => m !== method);
    update({ terminalPaymentMethods: next });
  };

  const connect = async () => {
    setError('');
    setBusy(true);
    try {
      await connectPaymentTerminal();
    } catch (e: any) {
      setError(e.message || 'Could not connect payment device');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setError('');
    await disconnectPaymentTerminal();
  };

  const ready = status === 'ready' || status === 'busy';

  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 820 }}>
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Payment device</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.55 }}>
          Off = cashiers enter Card / Wallet / Bank payments manually (current flow).
          On = those methods are charged on a connected device such as a CS30G PIN pad.
          Cash always stays manual.
        </p>
        {!isAdmin && (
          <p style={{ color: '#fbbf24', fontSize: 13 }}>View only. Ask an admin to change payment device settings.</p>
        )}

        <label style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '16px 0', borderBottom: '1px solid #e5e7eb', cursor: isAdmin ? 'pointer' : 'default' }}>
          <span>
            <span style={{ display: 'block', color: '#0f172a', fontSize: 14 }}>Enable payment terminal</span>
            <span style={{ display: 'block', color: '#64748b', fontSize: 12, marginTop: 4 }}>
              {settings.enablePaymentTerminal ? 'Device flow is ON for selected methods' : 'Manual payment entry is ON'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.enablePaymentTerminal}
            disabled={!isAdmin}
            onChange={(e) => update({ enablePaymentTerminal: e.target.checked })}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b' }}>Device model</label>
            <select
              style={input}
              disabled={!isAdmin}
              value={settings.paymentTerminalModel}
              onChange={(e) => update({ paymentTerminalModel: e.target.value as PosSettings['paymentTerminalModel'] })}
            >
              <option value="CS30G">CS30G</option>
              <option value="Generic ECR">Generic ECR terminal</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b' }}>Connection</label>
            <select
              style={input}
              disabled={!isAdmin}
              value={settings.paymentTerminalConnection}
              onChange={(e) => update({ paymentTerminalConnection: e.target.value as PosSettings['paymentTerminalConnection'] })}
            >
              <option value="serial">USB serial (CS30G cable)</option>
              <option value="network">Network / Wi-Fi (IP)</option>
              <option value="sandbox">Sandbox (test without hardware)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b' }}>Timeout (seconds)</label>
            <input
              type="number"
              min={15}
              max={180}
              style={input}
              disabled={!isAdmin}
              value={settings.paymentTerminalTimeoutSec}
              onChange={(e) => update({ paymentTerminalTimeoutSec: Math.max(15, Number(e.target.value) || 90) })}
            />
          </div>
          {settings.paymentTerminalConnection === 'serial' ? (
            <div>
              <label style={{ fontSize: 12, color: '#64748b' }}>USB baud rate</label>
              <input
                type="number"
                style={input}
                disabled={!isAdmin}
                value={settings.paymentTerminalBaudRate}
                onChange={(e) => update({ paymentTerminalBaudRate: Number(e.target.value) || 115200 })}
              />
            </div>
          ) : settings.paymentTerminalConnection === 'network' ? (
            <>
              <div>
                <label style={{ fontSize: 12, color: '#64748b' }}>Device IP</label>
                <input
                  style={input}
                  disabled={!isAdmin}
                  value={settings.paymentTerminalHost}
                  onChange={(e) => update({ paymentTerminalHost: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b' }}>Port</label>
                <input
                  type="number"
                  style={input}
                  disabled={!isAdmin}
                  value={settings.paymentTerminalPort}
                  onChange={(e) => update({ paymentTerminalPort: Number(e.target.value) || 8080 })}
                />
              </div>
            </>
          ) : (
            <div />
          )}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Methods that use the device</h3>
        <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>
          Selected methods must be charged on the {settings.paymentTerminalModel}. Unselected methods stay manual.
        </p>
        {METHODS.map((method) => (
          <label key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e5e7eb', cursor: isAdmin ? 'pointer' : 'default' }}>
            <span>{method}</span>
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={(settings.terminalPaymentMethods || []).includes(method)}
              onChange={(e) => toggleMethod(method, e.target.checked)}
            />
          </label>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Connect {settings.paymentTerminalModel}</h3>
        <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13 }}>
          Status: <strong style={{ color: ready ? '#059669' : status === 'connecting' ? '#d97706' : '#dc2626' }}>{status}</strong>
          {detail ? ` — ${detail}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" disabled={!isAdmin || busy || ready} style={btn('#014582')} onClick={connect}>
            {busy ? 'Connecting…' : 'Connect device'}
          </button>
          <button type="button" disabled={!ready} style={btn('rgba(239,68,68,0.75)')} onClick={disconnect}>
            Disconnect
          </button>
        </div>
        {error ? <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p> : null}
        <p style={{ color: '#64748b', fontSize: 12, marginBottom: 0, lineHeight: 1.5 }}>
          USB: plug the CS30G into this computer, click Connect, and pick the COM/serial device.
          Network: put the terminal on the same LAN and enter its IP. Sandbox lets you test the checkout UI without hardware.
        </p>
      </div>
    </div>
  );
}
