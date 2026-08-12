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
  Equal, Calculator, Shield, Briefcase, TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon, Activity
} from 'lucide-react';
import { cashFlowService, CashFlowData, CashFlowItem } from '../../api/cash-flow/route';
import { toast } from 'react-hot-toast';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import FiscalYearSelect from '../../../components/FiscalYearSelect';

// ─── TYPES ─────────────────────────────────────────────────────

interface PeriodOption {
  label: string;
  value: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function CashFlowPage() {
  const [reportData, setReportData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [selectedPeriod, setSelectedPeriod] = useState('This Year');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();

  const periodOptions: PeriodOption[] = [
    { label: 'Today', value: 'Today' },
    { label: 'This Week', value: 'This Week' },
    { label: 'This Month', value: 'This Month' },
    { label: 'This Quarter', value: 'This Quarter' },
    { label: 'This Year', value: 'This Year' },
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
      let params: any = {};
      
      if (isCustomRange && startDate && endDate) {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else {
        params.period = selectedPeriod;
      }
      if (selectedFiscalYearId) {
        params.fiscalYearId = selectedFiscalYearId;
      }

      const data = await cashFlowService.getReport(params);
      setReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch cash flow:', error);
      toast.error(error.message || 'Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, startDate, endDate, isCustomRange, selectedFiscalYearId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─── Handle Period Change ──────────────────────────────────

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setIsCustomRange(false);
    setStartDate(null);
    setEndDate(null);
  };

  // ─── Handle Date Range Change ──────────────────────────────

  const handleDateRangeApply = () => {
    if (startDate && endDate) {
      setIsCustomRange(true);
      setShowDatePicker(false);
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  // ─── Format Currency ──────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  // ─── Render Summary Cards ──────────────────────────────────

  const renderSummaryCards = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Opening Balance</p>
          <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(reportData.openingCashBalance)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Net Cash Flow</p>
          <p className={`text-lg md:text-xl font-bold mt-0.5 md:mt-1 ${reportData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(reportData.netCashFlow)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Closing Balance</p>
          <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(reportData.closingCashBalance)}</p>
        </div>
      </div>
    );
  };

  // ─── Render Activities Section ─────────────────────────────

  const renderActivitiesSection = (
    title: string,
    items: CashFlowItem[],
    total: number,
    color: string,
    icon: React.ReactNode,
    totalLabel: string
  ) => {
    if (!items || items.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            <span className="ml-auto text-sm font-bold text-gray-400">No data</span>
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
          {items.map((item, index) => {
            const isPositive = item.amount >= 0;
            return (
              <div key={index} className="px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="text-xs md:text-sm text-gray-600">{item.name}</span>
                <span className={`text-xs md:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(item.amount))}
                </span>
              </div>
            );
          })}
        </div>
        <div className={`px-3 md:px-4 py-2 md:py-2.5 ${color} border-t border-gray-100 flex items-center justify-between`}>
          <span className="text-xs md:text-sm font-bold text-gray-700">{totalLabel}</span>
          <span className={`text-xs md:text-sm font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    );
  };

  // ─── Render Net Cash Flow Card ─────────────────────────────

  const renderNetCashFlowCard = () => {
    if (!reportData) return null;

    const isPositive = reportData.netCashFlow >= 0;

    return (
      <div className={`rounded-xl p-4 border-2 ${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              {isPositive ? (
                <TrendingUp className={`w-5 h-5 text-green-600`} />
              ) : (
                <TrendingDown className={`w-5 h-5 text-red-600`} />
              )}
            </div>
            <span className={`text-base font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
              Net Cash Flow
            </span>
          </div>
          <span className={`text-lg md:text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(reportData.netCashFlow))}
          </span>
        </div>
        {reportData.netCashFlowPercentage !== 0 && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span>Change: {reportData.netCashFlowPercentage.toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  };

  // ─── Render Reconciliation ──────────────────────────────────

  const renderReconciliation = () => {
    if (!reportData) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-gray-700">Cash Balance Reconciliation</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600">Opening Cash Balance</span>
            <span className="text-sm font-medium text-gray-800">{formatCurrency(reportData.openingCashBalance)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600">Add: Net Cash Flow</span>
            <span className={`text-sm font-medium ${reportData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(reportData.netCashFlow)}
            </span>
          </div>
          <div className="border-t border-gray-200 my-1"></div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-bold text-gray-700">Closing Cash Balance</span>
            <span className="text-sm font-bold text-purple-600">{formatCurrency(reportData.closingCashBalance)}</span>
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
          <p className="mt-3 text-sm text-gray-500">Loading Cash Flow Statement...</p>
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
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
              Cash Flow
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Statement{selectedFiscalYear ? ` · ${selectedFiscalYear.name}` : ''}
            </p>
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
            onClick={() => cashFlowService.exportToPdf(reportData!, formatCurrency, selectedPeriod)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-500 transition-all"
            title="Export PDF"
          >
            <FileText className="w-4 h-4 text-red-500" />
          </button>
          <button
            onClick={() => cashFlowService.exportToExcel(reportData!, formatCurrency, selectedPeriod)}
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
              onClick={() => handlePeriodChange(option.value)}
              className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
                selectedPeriod === option.value && !isCustomRange
                  ? 'bg-[#014582] text-white shadow-lg shadow-[#014582]/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1 ${
              isCustomRange
                ? 'bg-[#014582] text-white shadow-lg shadow-[#014582]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                />
              </div>
              <div className="flex gap-2 mt-2 sm:mt-6">
                <button
                  onClick={() => {
                    setShowDatePicker(false);
                    setIsCustomRange(false);
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDateRangeApply}
                  className="px-4 py-1.5 text-sm bg-[#014582] text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Period Display */}
        {reportData && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Period: {reportData.periodText}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Main Report Body */}
      <div className="space-y-3 md:space-y-4">
        {/* Operating Activities */}
        {reportData && renderActivitiesSection(
          'Operating Activities',
          reportData.operatingItems,
          reportData.cashFlowFromOperations,
          'bg-blue-50',
          <Briefcase className="w-4 h-4 text-blue-600" />,
          'Net Cash from Operating'
        )}

        {/* Investing Activities */}
        {reportData && renderActivitiesSection(
          'Investing Activities',
          reportData.investingItems,
          reportData.cashFlowFromInvesting,
          'bg-orange-50',
          <TrendingDownIcon className="w-4 h-4 text-orange-600" />,
          'Net Cash from Investing'
        )}

        {/* Financing Activities */}
        {reportData && renderActivitiesSection(
          'Financing Activities',
          reportData.financingItems,
          reportData.cashFlowFromFinancing,
          'bg-green-50',
          <Building className="w-4 h-4 text-green-600" />,
          'Net Cash from Financing'
        )}

        {/* Net Cash Flow */}
        {renderNetCashFlowCard()}

        {/* Reconciliation */}
        {renderReconciliation()}
      </div>
    </div>
  );
}