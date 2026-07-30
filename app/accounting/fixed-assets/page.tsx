'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Users, Receipt,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText, CreditCard,
  RefreshCw, Trash2, Building2, CalendarDays,
  ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown,
  Send, Save, Printer, Download, Landmark,
  ReceiptText, ReceiptIndianRupee, ShoppingCart,
  User, Phone, Mail, Building, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit, Archive, MoreVertical, Info, Layers,
  BookOpen, FileSpreadsheet, FileText as FileTextIcon,
  PlusCircle, MinusCircle, List, Scale,
  Filter as FilterIcon, Calendar as CalendarIcon,
  Download as DownloadIcon, Printer as PrinterIcon,
  Eye as EyeIcon, EyeOff, ChevronUp, ChevronDown as ChevronDownIcon,
  History, Building as BuildingIcon, Hash,
  Banknote as BanknoteIcon, Handshake, Home, ShoppingBag,
  Receipt as ReceiptIcon, Briefcase, DollarSign as DollarSignIcon,
  Home as HomeIcon, Bolt, Users as UsersIcon, Megaphone, Package, Plane, Utensils,
  Shield as Security, Wrench as Build, Monitor as Computer, Receipt as ReceiptIcon2,
  UserCircle, PhoneCall, Mail as MailIcon, FileText as FileTextIcon2,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon, Package as InventoryIcon,
  Truck, Box, Settings
} from 'lucide-react';
import { fixedAssetsService, FixedAsset, Summary, Vendor } from '../../api/fixed-assets/route';
import { toast } from 'react-hot-toast';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [summary, setSummary] = useState<Summary>({
    totalAssets: 0,
    totalCost: 0,
    accumulatedDepreciation: 0,
    netBookValue: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    search: ''
  });
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDisposeForm, setShowDisposeForm] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Active', 'Fully Depreciated', 'Disposed'];
  const categoryOptions = ['Building', 'Vehicle', 'IT Equipment', 'Furniture', 'Machinery', 'Equipment'];

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

  // ─── Fetch Assets ─────────────────────────────────────────────

  const fetchAssets = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await fixedAssetsService.getAssets({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setAssets(response.data || []);
      setPagination(response.pagination);
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (error: any) {
      console.error('Failed to fetch assets:', error);
      toast.error(error.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit]);

  // ─── Fetch Vendors ────────────────────────────────────────────

  const fetchVendors = useCallback(async () => {
    try {
      const data = await fixedAssetsService.getVendors();
      setVendors(data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  }, []);

  // ─── Fetch Summary ────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await fixedAssetsService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await fixedAssetsService.getAssets({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setAssets(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more assets:', error);
      toast.error('Failed to load more assets');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchVendors();
    fetchSummary();
    fetchAssets(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setFilter(prev => ({ ...prev, search: query }));
    fetchAssets(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilter(prev => ({ ...prev, search: '' }));
    fetchAssets(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    fetchAssets(true);
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchAssets(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchAssets(false);
  };

  // ─── Create Asset ────────────────────────────────────────────

  const handleCreateAsset = async (data: any) => {
    setSubmitting(true);
    try {
      await fixedAssetsService.createAsset(data);
      toast.success('Asset created successfully!');
      setShowCreateForm(false);
      fetchSummary();
      fetchAssets(true);
    } catch (error: any) {
      console.error('Failed to create asset:', error);
      toast.error(error.message || 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Update Asset ────────────────────────────────────────────

  const handleUpdateAsset = async (data: any) => {
    setSubmitting(true);
    try {
      await fixedAssetsService.updateAsset(data);
      toast.success('Asset updated successfully!');
      setShowEditForm(false);
      setSelectedAsset(null);
      fetchSummary();
      fetchAssets(true);
    } catch (error: any) {
      console.error('Failed to update asset:', error);
      toast.error(error.message || 'Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Depreciate Asset ────────────────────────────────────────

  const handleDepreciateAsset = async (assetId: string) => {
    if (!confirm('Run depreciation for this asset?')) return;
    try {
      await fixedAssetsService.depreciateAsset(assetId);
      toast.success('Depreciation recorded successfully!');
      fetchSummary();
      fetchAssets(true);
    } catch (error: any) {
      console.error('Failed to depreciate asset:', error);
      toast.error(error.message || 'Failed to depreciate asset');
    }
  };

  // ─── Run Monthly Depreciation ───────────────────────────────

  const handleRunMonthlyDepreciation = async () => {
    if (!confirm('Run monthly depreciation for all assets?')) return;
    try {
      const result = await fixedAssetsService.runMonthlyDepreciation();
      toast.success(`Depreciation processed for ${result.processed} assets`);
      fetchSummary();
      fetchAssets(true);
    } catch (error: any) {
      console.error('Failed to run monthly depreciation:', error);
      toast.error(error.message || 'Failed to run monthly depreciation');
    }
  };

  // ─── Dispose Asset ───────────────────────────────────────────

  const handleDisposeAsset = async (data: any) => {
    setSubmitting(true);
    try {
      const result = await fixedAssetsService.disposeAsset(data);
      const gainLoss = result.gainLoss || 0;
      toast.success(
        `Asset disposed ${gainLoss >= 0 ? `with gain of ${formatCurrency(gainLoss)}` : `with loss of ${formatCurrency(Math.abs(gainLoss))}`}`
      );
      setShowDisposeForm(false);
      setSelectedAsset(null);
      fetchSummary();
      fetchAssets(true);
    } catch (error: any) {
      console.error('Failed to dispose asset:', error);
      toast.error(error.message || 'Failed to dispose asset');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Asset ────────────────────────────────────────────

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    if (!confirm(`Delete asset "${assetName}"?`)) return;
    try {
      await fixedAssetsService.deleteAsset(assetId);
      toast.success('Asset deleted successfully!');
      fetchSummary();
      fetchAssets(true);
    } catch (error: any) {
      console.error('Failed to delete asset:', error);
      toast.error(error.message || 'Failed to delete asset');
    }
  };

  // ─── View Asset Detail ──────────────────────────────────────

  const viewAssetDetail = (asset: FixedAsset) => {
    setSelectedAsset(asset);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Fully Depreciated': return 'bg-yellow-100 text-yellow-700';
      case 'Disposed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Fully Depreciated': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Disposed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Building': return BuildingIcon;
      case 'Vehicle': return Truck;
      case 'IT Equipment': return Computer;
      case 'Furniture': return Box;
      case 'Machinery': return Settings;
      default: return InventoryIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Building': return 'text-purple-600 bg-purple-100';
      case 'Vehicle': return 'text-blue-600 bg-blue-100';
      case 'IT Equipment': return 'text-green-600 bg-green-100';
      case 'Furniture': return 'text-orange-600 bg-orange-100';
      case 'Machinery': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDepreciationPercent = (asset: FixedAsset) => {
    if (asset.purchaseCost <= 0) return 0;
    return Math.min((asset.accumulatedDepreciation / asset.purchaseCost) * 100, 100);
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateAssetForm
          vendors={vendors}
          categoryOptions={categoryOptions}
          onCancel={() => setShowCreateForm(false)}
          onSave={handleCreateAsset}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : showEditForm && selectedAsset ? (
        <EditAssetForm
          asset={selectedAsset}
          vendors={vendors}
          categoryOptions={categoryOptions}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedAsset(null);
          }}
          onSave={handleUpdateAsset}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : showDisposeForm && selectedAsset ? (
        <DisposeAssetForm
          asset={selectedAsset}
          onCancel={() => {
            setShowDisposeForm(false);
            setSelectedAsset(null);
          }}
          onSave={handleDisposeAsset}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <InventoryIcon className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
                Fixed Assets
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} assets)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#7c4dff] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleRunMonthlyDepreciation}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Run Depreciation</span>
                <span className="sm:hidden">Depreciate</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Asset</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Assets</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{summary.totalAssets}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Cost</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalCost)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Depreciation</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600 mt-0.5 md:mt-1">{formatCurrency(summary.accumulatedDepreciation)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Net Book Value</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(summary.netBookValue)}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select
                    value={filter.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Asset List */}
          <div className="space-y-3 md:space-y-4">
            {loading && assets.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#7c4dff] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <InventoryIcon className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No assets found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              assets.map((asset) => {
                const statusColor = getStatusColor(asset.status);
                const statusIcon = getStatusIcon(asset.status);
                const CategoryIcon = getCategoryIcon(asset.category);
                const categoryColor = getCategoryColor(asset.category);
                const depPercent = getDepreciationPercent(asset);

                return (
                  <div
                    key={asset.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewAssetDetail(asset)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-2.5 rounded-xl ${categoryColor}`}>
                          <CategoryIcon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{asset.name}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{asset.status}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{asset.assetCode}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-500">{asset.category}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{formatDate(asset.purchaseDate)}</span>
                          </div>
                          {/* Depreciation Progress Bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Depreciation</span>
                              <span>{depPercent.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                              <div
                                className={`h-1.5 rounded-full ${depPercent > 90 ? 'bg-red-500' : depPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${depPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-green-600">{formatCurrency(asset.netBookValue)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">NBV</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && assets.length > 0 && (
            <div className="flex justify-center py-3 md:py-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[#7c4dff] hover:bg-[#7c4dff]/10 rounded-lg transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col xs:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-sm text-gray-500 text-center xs:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <span className="px-2 md:px-4 py-1 md:py-2 bg-[#7c4dff]/10 text-[#7c4dff] font-semibold rounded-lg text-xs md:text-sm">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && !showCreateForm && !showEditForm && !showDisposeForm && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onEdit={() => setShowEditForm(true)}
          onDispose={() => setShowDisposeForm(true)}
          onDepreciate={handleDepreciateAsset}
          onDelete={handleDeleteAsset}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getCategoryIcon={getCategoryIcon}
          getCategoryColor={getCategoryColor}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE ASSET FORM
// ═══════════════════════════════════════════════════════════════

function CreateAssetForm({
  vendors,
  categoryOptions,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Building',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    usefulLife: '5',
    salvageValue: '0',
    location: '',
    supplierId: '',
    warrantyExpiry: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Asset name is required');
      return;
    }
    const cost = parseFloat(formData.purchaseCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Please enter a valid purchase cost');
      return;
    }
    const life = parseInt(formData.usefulLife);
    if (isNaN(life) || life <= 0) {
      setError('Please enter a valid useful life');
      return;
    }
    setError('');

    onSave({
      name: formData.name,
      category: formData.category,
      purchaseDate: new Date(formData.purchaseDate),
      purchaseCost: cost,
      usefulLife: life,
      salvageValue: parseFloat(formData.salvageValue) || 0,
      location: formData.location,
      supplierId: formData.supplierId || undefined,
      warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
      notes: formData.notes
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <InventoryIcon className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Fixed Asset</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[600px] md:max-h-[700px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Asset Name *</label>
            <input
              type="text"
              placeholder="e.g., Office Building"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              {categoryOptions.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Purchase Date *</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Purchase Cost *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseCost: e.target.value }))}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Useful Life (years) *</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={formData.usefulLife}
                onChange={(e) => setFormData(prev => ({ ...prev, usefulLife: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Salvage Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.salvageValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, salvageValue: e.target.value }))}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Location</label>
            <input
              type="text"
              placeholder="e.g., Main Office"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Supplier</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select supplier (optional)</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Warranty Expiry</label>
            <input
              type="date"
              value={formData.warrantyExpiry}
              onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Add Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDIT ASSET FORM
// ═══════════════════════════════════════════════════════════════

function EditAssetForm({
  asset,
  vendors,
  categoryOptions,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    category: asset?.category || 'Building',
    purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    purchaseCost: asset?.purchaseCost?.toString() || '',
    usefulLife: asset?.usefulLife?.toString() || '5',
    salvageValue: asset?.salvageValue?.toString() || '0',
    location: asset?.location || '',
    supplierId: '',
    warrantyExpiry: asset?.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
    notes: asset?.notes || ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Asset name is required');
      return;
    }
    const cost = parseFloat(formData.purchaseCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Please enter a valid purchase cost');
      return;
    }
    const life = parseInt(formData.usefulLife);
    if (isNaN(life) || life <= 0) {
      setError('Please enter a valid useful life');
      return;
    }
    setError('');

    onSave({
      id: asset.id,
      name: formData.name,
      category: formData.category,
      purchaseDate: new Date(formData.purchaseDate),
      purchaseCost: cost,
      usefulLife: life,
      salvageValue: parseFloat(formData.salvageValue) || 0,
      location: formData.location,
      supplierId: formData.supplierId || undefined,
      warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
      notes: formData.notes
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Edit className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Edit Fixed Asset</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[600px] md:max-h-[700px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Same fields as CreateAssetForm but with initial values */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Asset Name *</label>
            <input
              type="text"
              placeholder="e.g., Office Building"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              {categoryOptions.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* ... rest of fields same as CreateAssetForm ... */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Purchase Date *</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Purchase Cost *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseCost: e.target.value }))}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Useful Life (years) *</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={formData.usefulLife}
                onChange={(e) => setFormData(prev => ({ ...prev, usefulLife: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Salvage Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.salvageValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, salvageValue: e.target.value }))}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Location</label>
            <input
              type="text"
              placeholder="e.g., Main Office"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Supplier</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select supplier (optional)</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Warranty Expiry</label>
            <input
              type="date"
              value={formData.warrantyExpiry}
              onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Update Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DISPOSE ASSET FORM
// ═══════════════════════════════════════════════════════════════

function DisposeAssetForm({
  asset,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    disposalDate: new Date().toISOString().split('T')[0],
    disposalAmount: asset?.netBookValue?.toString() || '0',
    disposalReason: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.disposalAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid disposal amount');
      return;
    }
    setError('');

    onSave({
      assetId: asset.id,
      disposalDate: new Date(formData.disposalDate),
      disposalAmount: amount,
      disposalReason: formData.disposalReason || 'Sold'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Dispose Asset</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{asset.name}</p>
          <p className="text-xs text-gray-500">Code: {asset.assetCode}</p>
          <p className="text-xs text-gray-500">
            Net Book Value: <span className="font-semibold text-green-600">{formatCurrency(asset.netBookValue)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Disposal Date *</label>
            <input
              type="date"
              value={formData.disposalDate}
              onChange={(e) => setFormData(prev => ({ ...prev, disposalDate: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Disposal Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.disposalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, disposalAmount: e.target.value }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Disposal Reason</label>
            <select
              value={formData.disposalReason}
              onChange={(e) => setFormData(prev => ({ ...prev, disposalReason: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="Sold">Sold</option>
              <option value="Scrapped">Scrapped</option>
              <option value="Donated">Donated</option>
              <option value="Stolen">Stolen</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-red-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Dispose Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ASSET DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function AssetDetailModal({
  asset,
  onClose,
  onEdit,
  onDispose,
  onDepreciate,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getCategoryIcon,
  getCategoryColor
}: any) {
  const statusColor = getStatusColor(asset.status);
  const statusIcon = getStatusIcon(asset.status);
  const CategoryIcon = getCategoryIcon(asset.category);
  const categoryColor = getCategoryColor(asset.category);
  const depPercent = asset.purchaseCost > 0 ? (asset.accumulatedDepreciation / asset.purchaseCost) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${categoryColor}`}>
              <CategoryIcon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{asset.name}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {asset.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{asset.assetCode}</span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{asset.category}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="bg-blue-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Cost</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">{formatCurrency(asset.purchaseCost)}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Depreciation</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600">{formatCurrency(asset.accumulatedDepreciation)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">NBV</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(asset.netBookValue)}</p>
            </div>
          </div>

          {/* Depreciation Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Depreciation Progress</span>
              <span>{depPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full ${depPercent > 90 ? 'bg-red-500' : depPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(depPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Purchase Date</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(asset.purchaseDate)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Useful Life</span>
              <span className="text-sm font-medium text-gray-800">{asset.usefulLife} years</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Salvage Value</span>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(asset.salvageValue)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Depreciation Method</span>
              <span className="text-sm font-medium text-gray-800">{asset.depreciationMethod}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Monthly Depreciation</span>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(asset.currentDepreciation)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Location</span>
              <span className="text-sm font-medium text-gray-800">{asset.location || '-'}</span>
            </div>
            {asset.supplier && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Supplier</span>
                <span className="text-sm font-medium text-gray-800">
                  {typeof asset.supplier === 'object' ? asset.supplier.name : asset.supplier}
                </span>
              </div>
            )}
            {asset.warrantyExpiry && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Warranty Expiry</span>
                <span className={`text-sm font-medium ${new Date(asset.warrantyExpiry) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatDate(asset.warrantyExpiry)}
                  {new Date(asset.warrantyExpiry) < new Date() && ' (Expired)'}
                </span>
              </div>
            )}
            {asset.notes && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <span className="text-sm font-medium text-gray-800">{asset.notes}</span>
              </div>
            )}
            {asset.lastDepreciationDate && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Last Depreciation</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(asset.lastDepreciationDate)}</span>
              </div>
            )}
            {asset.disposedDate && (
              <>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Disposal Date</span>
                  <span className="text-sm font-medium text-gray-800">{formatDate(asset.disposedDate)}</span>
                </div>
                {asset.disposalAmount !== undefined && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 font-medium">Disposal Amount</span>
                    <span className="text-sm font-medium text-gray-800">{formatCurrency(asset.disposalAmount)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {asset.status === 'Active' && (
                <>
                  <button
                    onClick={() => onDepreciate(asset.id)}
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                  >
                    <Calendar className="w-4 h-4" />
                    Depreciate
                  </button>
                  <button
                    onClick={() => onDispose()}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                  >
                    <Trash2 className="w-4 h-4" />
                    Dispose
                  </button>
                </>
              )}
              <button
                onClick={() => onEdit()}
                className="flex-1 px-4 py-2.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              {asset.status !== 'Disposed' && (
                <button
                  onClick={() => onDelete(asset.id, asset.name)}
                  className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}