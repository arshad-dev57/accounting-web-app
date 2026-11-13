'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Link2, Unlink,
  FileSpreadsheet, ArrowRight, Settings, Clock, Play, HelpCircle,
  Check, AlertTriangle, Layers,
} from 'lucide-react';
import {
  getGoogleAuthUrl, getGoogleConnections, disconnectGoogleConnection,
  listSpreadsheets, getSheetNames, previewGoogleSheet,
  updateConnectionConfig, syncGoogleSheet,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

function GoogleSheetsContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConnection, setActiveConnection] = useState<any | null>(null);

  // Connection Setup States
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [selectedSpreadsheetName, setSelectedSpreadsheetName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [syncMode, setSyncMode] = useState('ONE_TIME_IMPORT');
  const [syncInterval, setSyncInterval] = useState(60);

  // Preview & Mapping
  const [sheetPreview, setSheetPreview] = useState<any | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoogleConnections();
      const list = Array.isArray(data) ? data : [];
      setConnections(list);
      if (list.length > 0 && !activeConnection) {
        setActiveConnection(list[0]);
      }
    } catch {
      toast.error('Failed to load Google connections');
    } finally {
      setLoading(false);
    }
  }, [activeConnection]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // When active connection changes, load its spreadsheets
  useEffect(() => {
    if (activeConnection?.id) {
      listSpreadsheets(activeConnection.id)
        .then(files => {
          setSpreadsheets(Array.isArray(files) ? files : []);
          if (activeConnection.spreadsheetId) {
            setSelectedSpreadsheetId(activeConnection.spreadsheetId);
            setSelectedSpreadsheetName(activeConnection.spreadsheetName || '');
            setSelectedSheetName(activeConnection.sheetName || '');
            setSyncMode(activeConnection.syncMode || 'ONE_TIME_IMPORT');
            setSyncInterval(activeConnection.syncIntervalMinutes || 60);
            if (activeConnection.columnMapping) {
              setColumnMapping(activeConnection.columnMapping);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeConnection]);

  // When spreadsheet selected, load sheet tabs
  useEffect(() => {
    if (activeConnection?.id && selectedSpreadsheetId) {
      getSheetNames(activeConnection.id, selectedSpreadsheetId)
        .then(names => {
          const list = Array.isArray(names) ? names : [];
          setSheets(list);
          if (list.length > 0 && !selectedSheetName) {
            setSelectedSheetName(list[0]);
          }
        })
        .catch(() => {});
    }
  }, [activeConnection, selectedSpreadsheetId, selectedSheetName]);

  const handleConnectGoogle = async () => {
    try {
      const authUrl = await getGoogleAuthUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      toast.error(err.message || 'Google OAuth is not configured on server');
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this Google Account?')) return;
    try {
      await disconnectGoogleConnection(id);
      toast.success('Disconnected');
      setActiveConnection(null);
      loadConnections();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleLoadPreview = async () => {
    if (!activeConnection?.id || !selectedSpreadsheetId) return;
    setPreviewLoading(true);
    try {
      const res = await previewGoogleSheet(activeConnection.id, selectedSpreadsheetId, selectedSheetName);
      if (res.success) {
        setSheetPreview(res.data);
        if (res.data.autoMapping && Object.keys(columnMapping).length === 0) {
          setColumnMapping(res.data.autoMapping);
        }
        toast.success(`Loaded ${res.data.totalRows} rows preview`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeConnection?.id) return;
    try {
      await updateConnectionConfig(activeConnection.id, {
        spreadsheetId: selectedSpreadsheetId,
        spreadsheetName: selectedSpreadsheetName,
        sheetName: selectedSheetName,
        syncMode,
        syncIntervalMinutes: Number(syncInterval),
        columnMapping,
      });
      toast.success('Connection settings saved!');
      loadConnections();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    }
  };

  const handleTriggerSync = async () => {
    if (!activeConnection?.id) return;
    setSyncing(true);
    try {
      const res = await syncGoogleSheet(activeConnection.id);
      toast.success(res.message || 'Sync completed!');
      loadConnections();
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Sheets Integration</h1>
          <p className="text-gray-500 text-sm">
            Live synchronization between Google Spreadsheets and Bisonstechs CRM
          </p>
        </div>

        <button
          onClick={handleConnectGoogle}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#014582] text-white rounded-xl text-sm font-semibold hover:bg-[#01366a] transition-colors shadow-sm"
        >
          <Link2 className="w-4 h-4" /> Connect Google Account
        </button>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Connected Google Accounts
        </h2>

        {connections.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-medium text-gray-600">No Google account connected yet</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Connect your Google workspace to sync rows from your Google Sheets directly into your CRM pipeline.
            </p>
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-blue-50 text-[#014582] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {connections.map(c => {
              const isActive = activeConnection?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConnection(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isActive ? 'border-[#014582] bg-blue-50/20 ring-2 ring-[#014582]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      GS
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{c.googleAccountEmail}</p>
                      <p className="text-xs text-gray-500">
                        {c.spreadsheetName ? `Linked to: ${c.spreadsheetName}` : 'No sheet linked'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDisconnect(c.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    title="Disconnect"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spreadsheet Configuration for Active Connection */}
      {activeConnection && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-800">
                Configure Spreadsheet: <span className="text-[#014582]">{activeConnection.googleAccountEmail}</span>
              </h2>
              {activeConnection.lastSyncStatus && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  activeConnection.lastSyncStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  Last Sync: {activeConnection.lastSyncStatus}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Select Google Spreadsheet</label>
                <select
                  value={selectedSpreadsheetId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedSpreadsheetId(id);
                    const selected = spreadsheets.find(s => s.id === id);
                    if (selected) setSelectedSpreadsheetName(selected.name);
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                >
                  <option value="">-- Choose from your Google Drive --</option>
                  {spreadsheets.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Worksheet / Tab</label>
                <select
                  value={selectedSheetName}
                  onChange={e => setSelectedSheetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                >
                  {sheets.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {sheets.length === 0 && <option value="">Sheet1</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Sync Mode</label>
                <select
                  value={syncMode}
                  onChange={e => setSyncMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                >
                  <option value="ONE_TIME_IMPORT">A. One-time Import (Manual Snapshot)</option>
                  <option value="SHEETS_TO_CRM">B. Google Sheets to CRM (Pull new/updated rows)</option>
                  <option value="CRM_TO_SHEETS">C. CRM to Google Sheets (Push changes to sheet)</option>
                  <option value="TWO_WAY">D. Two-way Bi-directional Sync</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Sync Interval (Minutes)</label>
                <select
                  value={syncInterval}
                  onChange={e => setSyncInterval(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                >
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 1 hour</option>
                  <option value={360}>Every 6 hours</option>
                  <option value={1440}>Once daily</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                type="button"
                onClick={handleLoadPreview}
                disabled={!selectedSpreadsheetId || previewLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {previewLoading ? 'Reading Sheet...' : 'Preview Columns & Data'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={syncing || !selectedSpreadsheetId}
                  className="px-5 py-2 bg-[#014582] text-white rounded-xl text-xs font-bold hover:bg-[#01366a] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Sheet Preview & Column Mapping */}
          {sheetPreview && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm text-gray-800">
                Column Mapping ({sheetPreview.headers?.length || 0} columns detected)
              </h3>

              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {sheetPreview.headers?.map((header: string) => {
                  const mapped = columnMapping[header] || '';
                  return (
                    <div key={header} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-1/3">
                        <p className="font-semibold text-xs text-gray-800">{header}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          Sample: {String(sheetPreview.preview?.[0]?.[header] || '—')}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                      <select
                        value={mapped}
                        onChange={e => setColumnMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className="w-1/2 px-3 py-1.5 border rounded-lg text-xs"
                      >
                        <option value="">-- Ignore this column --</option>
                        <option value="fullName">Full Name</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="companyName">Company</option>
                        <option value="city">City</option>
                        <option value="country">Country</option>
                        <option value="source">Lead Source</option>
                        <option value="status">Lead Status</option>
                        <option value="interest">Interest</option>
                        <option value="budget">Budget</option>
                        <option value="notes">Notes</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup Guide for Google Cloud Console */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-xs text-amber-900 space-y-2">
        <p className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" /> Google Cloud Console Setup Instructions
        </p>
        <p>To enable real Google Sheets sync in production, add these variables to your <code>.env</code> file:</p>
        <pre className="bg-amber-100/70 p-3 rounded-xl font-mono text-[11px] text-amber-950 overflow-x-auto">
{`GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/crm/google-sheets/callback"
GOOGLE_SHEETS_SCOPES="https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive.metadata.readonly"`}
        </pre>
        <ol className="list-decimal pl-4 space-y-1 text-amber-900">
          <li>Create a project in <strong>Google Cloud Console</strong>.</li>
          <li>Enable <strong>Google Sheets API</strong> and <strong>Google Drive API</strong>.</li>
          <li>Configure <strong>OAuth Consent Screen</strong> (External or Internal).</li>
          <li>Create Credentials &gt; <strong>OAuth Client ID (Web Application)</strong>.</li>
          <li>Add Authorized redirect URI: <code>http://localhost:5000/api/crm/google-sheets/callback</code> (or your production URL).</li>
        </ol>
      </div>
    </div>
  );
}

export default function GoogleSheetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading Google Sheets...</div>}>
      <GoogleSheetsContent />
    </Suspense>
  );
}
