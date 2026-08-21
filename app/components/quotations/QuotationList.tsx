'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Quotation, QuotationStats } from '@/lib/types/quotation';

interface QuotationListProps {
  onQuotationClick?: (quotation: Quotation) => void;
  onCreateClick?: () => void;
}

export default function QuotationList({ onQuotationClick, onCreateClick }: QuotationListProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [stats, setStats] = useState<QuotationStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const filters = ['all', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'];

  useEffect(() => {
    fetchQuotations();
  }, [currentPage]);

  useEffect(() => {
    applyLocalFilters();
  }, [quotations, selectedFilter, searchQuery]);

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quotations?page=${currentPage}&limit=10`);
      const result = await response.json();

      if (result.success && result.data) {
        setQuotations(result.data);
        if (result.kpi) setStats(result.kpi);
        if (result.pagination) {
          setTotalRecords(result.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyLocalFilters = () => {
    let filtered = quotations;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(q => q.status === selectedFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.quotationNumber.toLowerCase().includes(query) ||
        q.customerName.toLowerCase().includes(query) ||
        (q.customerEmail && q.customerEmail.toLowerCase().includes(query)) ||
        (q.customerCompany && q.customerCompany.toLowerCase().includes(query))
      );
    }

    setFilteredQuotations(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-orange-100 text-orange-700';
      case 'Sent': return 'bg-blue-100 text-blue-700';
      case 'Accepted': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Expired': return 'bg-gray-100 text-gray-700';
      case 'Converted': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return FileText;
      case 'Sent': return Send;
      case 'Accepted': return CheckCircle;
      case 'Rejected': return XCircle;
      case 'Expired': return Calendar;
      case 'Converted': return CheckCircle;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-[#014582] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Quotations</h2>
            <p className="text-white/70 text-sm">{totalRecords} quotations</p>
          </div>
          <button
            onClick={fetchQuotations}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-300">{stats.draft}</p>
              <p className="text-xs text-white/70">Draft</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-300">{stats.sent}</p>
              <p className="text-xs text-white/70">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-300">{stats.converted}</p>
              <p className="text-xs text-white/70">Converted</p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#014582]/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedFilter === filter
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Quotation List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading quotations...</div>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p>No quotations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQuotations.map((quotation) => {
              const StatusIcon = getStatusIcon(quotation.status);
              return (
                <div
                  key={quotation.id}
                  onClick={() => onQuotationClick?.(quotation)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getStatusColor(quotation.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{quotation.quotationNumber}</p>
                          <p className="text-sm text-gray-500">{quotation.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 ml-11">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(quotation.quotationDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{quotation.salesPerson || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{quotation.items.length} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(quotation.grandTotal)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalRecords > 10 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {Math.min(currentPage * 10, totalRecords)} of {totalRecords} quotations
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage * 10 >= totalRecords}
              className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
