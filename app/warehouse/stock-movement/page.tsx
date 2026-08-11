'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Minus, Package, Box,
  Truck, TrendingUp, TrendingDown, Calendar,
  User, FileText, CheckCircle, XCircle,
  AlertCircle, Loader2, ChevronDown, X,
  Layers, BarChart3, Filter, Download,
  Printer, Eye, Edit, Trash2, RefreshCw
} from 'lucide-react';
import { stockService, StockMovement } from '../../api/stock/routes';
import { supplierService, Supplier } from '../../api/supplier/route';
import { apiClient } from '@/lib/api-client';

// ============================================================
// PRODUCT SEARCH COMPONENT
// ============================================================
function ProductSearch({ 
  onSelect, 
  selectedProduct,
  excludeProductId 
}: { 
  onSelect: (product: any) => void;
  selectedProduct: any | null;
  excludeProductId?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
    }
  }, [selectedProduct]);

  const handleSearch = useCallback(async (value: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/warehouse/products?search=${value}&limit=10`);
      if (response.success) {
        let products = response.data.data || [];
        if (excludeProductId) {
          products = products.filter((p: any) => p._id !== excludeProductId);
        }
        setResults(products);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [excludeProductId]);

  const handleSelect = (product: any) => {
    setSearchTerm(product.name);
    setIsOpen(false);
    onSelect(product);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search product by name or SKU..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {isOpen && searchTerm.length >= 2 && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product._id}
              onClick={() => handleSelect(product)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{product.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{product.categoryName || 'Uncategorized'}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-gray-700">{product.currentStock} {product.stockUnit}</p>
                <span className="text-xs text-gray-400">in stock</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPLETE STOCK IN FORM - FIXED
// ============================================================
// COMPLETE STOCK IN FORM - FIXED
// ============================================================
function StockInForm({ onSuccess }: { onSuccess: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [stockType, setStockType] = useState<'bulk' | 'box'>('bulk');
  const [quantity, setQuantity] = useState('');
  const [boxCount, setBoxCount] = useState('');
  const [piecesPerBox, setPiecesPerBox] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // ─── Fetch Suppliers ──────────────────────────────────────
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await supplierService.getSuppliers({ limit: 100 });
        setSuppliers(response.data || []);
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const totalPieces = stockType === 'box' && boxCount && piecesPerBox
    ? parseInt(boxCount) * parseInt(piecesPerBox)
    : 0;

  // ─── COMPLETE HANDLE SUBMIT ──────────────────────────────────
  const handleSubmit = async () => {
    // ✅ Debug: Log selected product
    console.log('🔍 Selected Product:', selectedProduct);
    console.log('🔍 Product ID:', selectedProduct?._id || selectedProduct?.id);
    
    // ✅ Validation with proper error messages
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    
    // ✅ Get the product ID properly (handle both _id and id)
    const productId = selectedProduct._id || selectedProduct.id;
    if (!productId) {
      setError('Product ID not found. Please re-select the product.');
      return;
    }
    
    if (stockType === 'bulk' && !quantity) {
      setError('Please enter quantity');
      return;
    }
    
    if (stockType === 'box' && (!boxCount || !piecesPerBox)) {
      setError('Please enter both box count and pieces per box');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // ✅ Get the selected supplier object properly
      const selectedSupplierObj = suppliers.find(s => (s._id || s.id) === selectedSupplier);
      
      // ✅ Build payload with correct product ID
      const payload: any = {
        productId: productId,  // ✅ Use the extracted productId
        stockType: stockType,
        quantity: stockType === 'box' ? parseInt(boxCount) : parseInt(quantity),
        supplierName: selectedSupplierObj?.name || 'Walk-in',
        reference: reference || '',
        notes: notes || '',
      };

      // ✅ Only send supplierId if a valid supplier is selected
      if (selectedSupplier && selectedSupplierObj) {
        payload.supplierId = selectedSupplierObj._id || selectedSupplierObj.id;
      }

      if (stockType === 'box') {
        payload.boxCount = parseInt(boxCount);
        payload.piecesPerBox = parseInt(piecesPerBox);
      }

      console.log('📦 Stock In Payload:', JSON.stringify(payload, null, 2));

      const response = await stockService.addStock(payload);
      console.log('✅ Stock In Response:', response);
      
      alert('Stock added successfully!');
      
      // Reset form
      setQuantity('');
      setBoxCount('');
      setPiecesPerBox('');
      setSelectedSupplier('');
      setReference('');
      setNotes('');
      setSelectedProduct(null);
      onSuccess();
    } catch (err: any) {
      console.error('❌ Stock In error:', err);
      setError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-bold text-gray-800">Stock In</h3>
        <span className="text-xs text-gray-400 ml-2">Receive inventory</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Select Product *
        </label>
        <ProductSearch 
          onSelect={(product) => {
            console.log('✅ Product selected:', product);
            setSelectedProduct(product);
          }} 
          selectedProduct={selectedProduct}
        />
        {selectedProduct && (
          <div className="mt-2 text-xs text-gray-500">
            Selected: <span className="font-semibold text-gray-700">{selectedProduct.name}</span>
            {' '}(ID: <span className="font-mono">{selectedProduct._id || selectedProduct.id}</span>)
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setStockType('bulk')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            stockType === 'bulk'
              ? 'border-[#014582] bg-[#014582]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className={`w-4 h-4 ${stockType === 'bulk' ? 'text-[#014582]' : 'text-gray-400'}`} />
            <span className="text-sm font-semibold text-gray-800">Bulk Quantity</span>
          </div>
          <p className="text-xs text-gray-500">Add stock as simple quantity</p>
        </button>

        <button
          onClick={() => setStockType('box')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            stockType === 'box'
              ? 'border-[#014582] bg-[#014582]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Box className={`w-4 h-4 ${stockType === 'box' ? 'text-[#014582]' : 'text-gray-400'}`} />
            <span className="text-sm font-semibold text-gray-800">Box / Case</span>
          </div>
          <p className="text-xs text-gray-500">Add stock with box & piece tracking</p>
        </button>
      </div>

      {stockType === 'bulk' ? (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Quantity *
          </label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="Enter quantity..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Number of Boxes *
            </label>
            <input
              type="number"
              placeholder="e.g., 50"
              value={boxCount}
              onChange={(e) => setBoxCount(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Pieces per Box *
            </label>
            <input
              type="number"
              placeholder="e.g., 12"
              value={piecesPerBox}
              onChange={(e) => setPiecesPerBox(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
      )}

      {stockType === 'box' && boxCount && piecesPerBox && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-100 mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Box Conversion Summary</p>
              <p className="text-sm text-green-700">
                {boxCount} boxes × {piecesPerBox} pieces = <strong>{totalPieces}</strong> total pieces
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ COMPLETE SUPPLIER DROPDOWN - FIXED */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Supplier
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 appearance-none"
            disabled={loadingSuppliers}
          >
            <option value="">Select supplier...</option>
            {suppliers.map((supplier) => (
              <option key={supplier._id || supplier.id} value={supplier._id || supplier.id}>
                {supplier.name} {supplier.companyName ? `(${supplier.companyName})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          {loadingSuppliers && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Reference #
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="PO # or Invoice #"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Notes
          </label>
          <input
            type="text"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !selectedProduct}
        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <TrendingUp className="w-4 h-4" />
            Confirm Stock In
          </>
        )}
      </button>
    </div>
  );
}// ============================================================
// STOCK OUT FORM - COMPLETE
// ============================================================
function StockOutForm({ onSuccess }: { onSuccess: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('');
  const [customer, setCustomer] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (parseInt(quantity) > selectedProduct.currentStock) {
      setError(`Insufficient stock. Available: ${selectedProduct.currentStock}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await stockService.removeStock({
        productId: selectedProduct._id,
        quantity: parseInt(quantity),
        reason: reason || 'Sales Order',
        customerName: customer || 'Walk-in Customer',
        reference: reference || '',
        notes: notes || '',
      });

      alert('Stock out confirmed!');
      setQuantity('');
      setCustomer('');
      setReason('');
      setReference('');
      setNotes('');
      setSelectedProduct(null);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-bold text-gray-800">Stock Out</h3>
        <span className="text-xs text-gray-400 ml-2">Dispatch inventory</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Select Product *
        </label>
        <ProductSearch 
          onSelect={setSelectedProduct} 
          selectedProduct={selectedProduct}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Quantity *
        </label>
        <div className="relative">
          <Minus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="Enter quantity..."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
          />
        </div>
      </div>

      {selectedProduct && quantity && parseInt(quantity) > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Stock After Dispatch</p>
              <p className="text-sm text-yellow-700">
                {selectedProduct.currentStock - parseInt(quantity)} {selectedProduct.stockUnit} remaining
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Customer
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Customer name..."
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Reason *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="e.g., Sales Order, Damaged"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Reference #
          </label>
          <input
            type="text"
            placeholder="SO # or Invoice #"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Notes
          </label>
          <input
            type="text"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !selectedProduct || !quantity}
        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <TrendingDown className="w-4 h-4" />
            Confirm Stock Out
          </>
        )}
      </button>
    </div>
  );
}

// ============================================================
// STOCK MOVEMENT HISTORY TABLE
// ============================================================
function StockHistory({ movements, loading, onRefresh }: { 
  movements: StockMovement[]; 
  loading: boolean;
  onRefresh: () => void;
}) {
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [search, setSearch] = useState('');

  const filteredMovements = movements.filter(m => {
    const matchSearch = m.productName.toLowerCase().includes(search.toLowerCase()) ||
                        (m.reference || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' ? true : 
                      filterType === 'in' ? m.type === 'stock_in' : m.type === 'stock_out';
    return matchSearch && matchType;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBoxDetails = (movement: StockMovement) => {
    if (movement.stockType === 'box' && movement.stockDetails) {
      const { boxCount, piecesPerBox, totalPieces } = movement.stockDetails;
      return `${boxCount || 0} boxes × ${piecesPerBox || 0} pcs = ${totalPieces || 0} total`;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#014582]" />
          Stock Movement History
          <span className="text-xs font-normal text-gray-400 ml-2">
            ({movements.length} records)
          </span>
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none w-36"
            />
          </div>
          <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5">
            {(['all', 'in', 'out'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  filterType === type
                    ? type === 'in' ? 'bg-green-100 text-green-700' :
                      type === 'out' ? 'bg-red-100 text-red-700' :
                      'bg-[#014582] text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All' : type === 'in' ? 'Stock In' : 'Stock Out'}
              </button>
            ))}
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
          <p className="mt-2 text-gray-500">Loading movements...</p>
        </div>
      ) : filteredMovements.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No stock movements found</p>
          <p className="text-sm text-gray-400">Start by adding stock using the form</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Box Details</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{movement.productName}</p>
                      <p className="text-xs text-gray-400">
                        {movement.previousStock} → {movement.newStock}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      movement.type === 'stock_in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {movement.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-gray-700">
                    {movement.quantity}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {getBoxDetails(movement) ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {getBoxDetails(movement)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(movement.status)}`}>
                      {movement.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {movement.reference || '-'}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {movement.createdAt ? new Date(movement.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function StockMovementPage() {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await stockService.getMovements({ limit: 50 });
      setMovements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements, refreshKey]);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/warehouse/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#014582]" />
            Stock Movement
          </h2>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5">
        <button
          onClick={() => setActiveTab('in')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'in'
              ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Stock In
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'out'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Stock Out
        </button>
      </div>

      {/* Forms + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {activeTab === 'in' ? (
            <StockInForm onSuccess={handleSuccess} />
          ) : (
            <StockOutForm onSuccess={handleSuccess} />
          )}
        </div>

        <div className="lg:col-span-2">
          <StockHistory 
            movements={movements} 
            loading={loading} 
            onRefresh={fetchMovements}
          />
        </div>
      </div>
    </div>
  );
}