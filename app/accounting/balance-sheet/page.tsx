'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Download, Calendar, TrendingUp, TrendingDown,
  FileSpreadsheet, FileText, ChevronDown, Loader2, X,
  AlertCircle, CheckCircle, Clock, DollarSign,
  ArrowUpRight, ArrowDownRight, Receipt, Wallet, Building, Landmark,
  BarChart, PieChart, Settings, HelpCircle, ChevronRight, Printer,
  CheckCircle as CheckCircleIcon, AlertTriangle, Minus, Plus,
  Equal, Calculator, Shield
} from 'lucide-react';
import { balanceSheetService, BalanceSheetData, BalanceSheetCategory } from '../../api/balance-sheet/route';
import { toast } from 'react-hot-toast';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import FiscalYearSelect from '../../../components/FiscalYearSelect';

// ─── TYPES ─────────────────────────────────────────────────────

interface PeriodOption {
  label: string;
  value: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function BalanceSheetPage() {
  const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();

  const periodOptions: PeriodOption[] = [
    { label: 'All Time', value: 'All Time' },
    { label: 'This Year', value: 'This Year' },
    { label: 'This Quarter', value: 'This Quarter' },
    { label: 'This Month', value: 'This Month' },
  ];

  // ─── Get Currency Symbol from Local Storage ──────────────────

  const getCurrencySymbol = () => {
    try {
      const saved = localStorage.getItem('sales_selected_currency');
      if (saved) {
        const currency = JSON.parse(saved);
        return currency.symbol || 'Rs.';
      }
    } catch (e) {
      console.error('Error getting currency:', e);
    }
    return 'Rs.';
  };

  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol());
  }, []);

  // ─── Fetch Report Data ──────────────────────────────────────

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedPeriod !== 'All Time') {
        params.period = selectedPeriod;
      }
      if (selectedFiscalYearId) {
        params.fiscalYearId = selectedFiscalYearId;
      }

      const data = await balanceSheetService.getReport(params);
      setReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch balance sheet:', error);
      toast.error(error.message || 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedFiscalYearId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─── Format Currency ──────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── Render Category Section ──────────────────────────────

  const renderCategorySection = (
    title: string,
    categories: BalanceSheetCategory[],
    total: number,
    color: string,
    icon: React.ReactNode
  ) => {
    if (!categories || categories.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            <span className="ml-auto text-sm font-bold text-gray-400">No entries</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-3 md:px-4 py-2 md:py-3 ${color} border-b border-gray-100 flex items-center gap-2`}>
          {icon}
          <h3 className="text-sm md:text-base font-semibold text-gray-700">{title}</h3>
          <span className="ml-auto text-sm font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {categories.map((category, idx) => (
            <div key={idx} className="px-3 md:px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-medium text-gray-700">{category.name}</span>
                <span className="text-xs md:text-sm font-bold text-gray-800">{formatCurrency(category.total)}</span>
              </div>
              {category.items && category.items.length > 0 && (
                <div className="mt-1 space-y-0.5 pl-4 border-l-2 border-gray-200">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.name}</span>
                      <span className="text-xs text-gray-600">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Render Accounting Equation ────────────────────────────

  const renderAccountingEquation = () => {
    if (!reportData) return null;

    const totalLE = reportData.totalLiabilities + reportData.totalEquity;
    const isBalanced = Math.abs(reportData.totalAssets - totalLE) < 1;

    return (
      <div className={`rounded-xl p-4 border-2 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Calculator className={`w-5 h-5 ${isBalanced ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`text-sm font-bold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
            Accounting Equation
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500">Assets</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.totalAssets)}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">=</span>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500">Liabilities + Equity</p>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(totalLE)}</p>
          </div>
        </div>

        <div className="mt-3 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isBalanced ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Balanced ✓
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Difference: {formatCurrency(Math.abs(reportData.totalAssets - totalLE))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-[#014582] animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading Balance Sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Landmark className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
              Balance Sheet
            </h2>
            {reportData && (
              <p className="text-xs text-gray-500 mt-0.5">
                As of {formatDate(reportData.asOfDate)}
                {selectedFiscalYear ? ` · ${selectedFiscalYear.name}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <FiscalYearSelect compact showManageLink={false} />
          <button
            onClick={fetchReport}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => balanceSheetService.exportToPdf(reportData!, formatCurrency, selectedPeriod)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-500 transition-all"
            title="Export PDF"
          >
            <FileText className="w-4 h-4 text-red-500" />
          </button>
          <button
            onClick={() => balanceSheetService.exportToExcel(reportData!, formatCurrency, selectedPeriod)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-600 transition-all"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
              className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
                selectedPeriod === option.value
                  ? 'bg-[#014582] text-white shadow-lg shadow-[#014582]/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {reportData && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Period: {selectedPeriod}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Assets</p>
          <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">
            {formatCurrency(reportData?.totalAssets || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Liabilities</p>
          <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">
            {formatCurrency(reportData?.totalLiabilities || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Equity</p>
          <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">
            {formatCurrency(reportData?.totalEquity || 0)}
          </p>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="space-y-3 md:space-y-4">
        {/* Assets Section */}
        {renderCategorySection(
          'Assets',
          reportData?.assets || [],
          reportData?.totalAssets || 0,
          'bg-blue-50',
          <Wallet className="w-4 h-4 text-blue-600" />
        )}

        {/* Liabilities Section */}
        {renderCategorySection(
          'Liabilities',
          reportData?.liabilities || [],
          reportData?.totalLiabilities || 0,
          'bg-red-50',
          <Receipt className="w-4 h-4 text-red-600" />
        )}

        {/* Equity Section */}
        {renderCategorySection(
          'Equity',
          reportData?.equity || [],
          reportData?.totalEquity || 0,
          'bg-green-50',
          <TrendingUp className="w-4 h-4 text-green-600" />
        )}

        {/* Accounting Equation */}
        {renderAccountingEquation()}
      </div>
    </div>
  );
}