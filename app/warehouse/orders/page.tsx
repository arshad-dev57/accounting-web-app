'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Edit, Trash2, Eye, Package,
  ChevronDown, X, Save, User, Mail, Phone, MapPin,
  DollarSign, Tag, Truck, Calendar, Loader2,
  CheckCircle, XCircle, Clock, Filter, Download,
  Printer, RefreshCw, Layers, ShoppingCart,
  CreditCard, Receipt, Building2, Hash, Type,
  AlignLeft, Box, Minus, Plus as PlusIcon,
  AlertCircle, Globe, CalendarDays, UserRound,
  FileText, ListChecks, TruckIcon, PackageOpen,
  Shield, BadgePercent, Clock3, UserCheck,
  ClipboardList, Building, Briefcase, PackageCheck,
  Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────
import { orderService, Order, OrderListResponse } from '../../api/order/route';
import { settingService } from '../../api/settings/route';
import { productService, Product } from '../../api/product/route';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  batchNumber?: string;
  serialNumber?: string;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  notes?: string;
}
// ─────────────────────────────────────────────────────────────
// PRODUCT SEARCH DROPDOWN WITH CLICK TO OPEN
// ─────────────────────────────────────────────────────────────
function ProductSearchDropdown({ 
  onSelect,
  selectedProduct,
  placeholder = "Search product by name or SKU...",
  className = ""
}: { 
  onSelect: (product: any) => void;
  selectedProduct: any | null;
  placeholder?: string;
  className?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement | null>(null);

  // ─── Click outside to close ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Update search term when product is selected ──────────
  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
      setIsOpen(false);
    }
  }, [selectedProduct]);

  // ─── Fetch products with pagination ───────────────────────
  const fetchProducts = useCallback(async (page: number, search: string = '') => {
    try {
      const response = await productService.getProducts({
        page,
        limit: pagination.limit,
        search: search || undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      if (response.success) {
        return {
          products: response.data,
          pagination: response.pagination
        };
      }
      return null;
    } catch (error) {
      console.error('Fetch products error:', error);
      return null;
    }
  }, [pagination.limit]);

  // ─── Initial load when dropdown opens ─────────────────────
  const loadInitialProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchProducts(1, '');
      if (result) {
        setProducts(result.products);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: result.pagination.total,
          pages: result.pagination.pages,
          hasNext: result.pagination.hasNext,
          hasPrev: result.pagination.hasPrev
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  // ─── Handle search ─────────────────────────────────────────
  const handleSearch = useCallback(async (search: string) => {
    setSearchTerm(search);
    
    if (search.length === 0) {
      // If search is empty, load initial products
      await loadInitialProducts();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await fetchProducts(1, search);
      if (result) {
        setProducts(result.products);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: result.pagination.total,
          pages: result.pagination.pages,
          hasNext: result.pagination.hasNext,
          hasPrev: result.pagination.hasPrev
        }));
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, loadInitialProducts]);

  // ─── Load more products (infinite scroll) ─────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination.hasNext) return;

    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const result = await fetchProducts(nextPage, searchTerm);
      
      if (result) {
        setProducts(prev => [...prev, ...result.products]);
        setPagination(prev => ({
          ...prev,
          page: nextPage,
          total: result.pagination.total,
          pages: result.pagination.pages,
          hasNext: result.pagination.hasNext,
          hasPrev: result.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination.hasNext, pagination.page, fetchProducts, searchTerm]);

  // ─── Debounced search ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        handleSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, handleSearch]);

  // ─── Intersection Observer for infinite scroll ────────────
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasNext && !loading && !loadingMore && isOpen) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (lastProductRef.current) {
      observerRef.current.observe(lastProductRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [products, pagination.hasNext, loading, loadingMore, loadMore, isOpen]);

  // ─── Handle dropdown toggle ──────────────────────────────
  const handleToggleDropdown = () => {
    if (!isOpen) {
      // Open dropdown and load products
      setIsOpen(true);
      if (products.length === 0 && !loading) {
        loadInitialProducts();
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (product: any) => {
    setSearchTerm(product.name);
    setIsOpen(false);
    onSelect(product);
  };

  // ─── Clear selection ──────────────────────────────────────
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm('');
    setProducts([]);
    setIsOpen(false);
    onSelect(null);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="relative cursor-pointer"
        onClick={handleToggleDropdown}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            e.stopPropagation();
            setSearchTerm(e.target.value);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 cursor-pointer"
        />
        {selectedProduct && searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && !loadingMore && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {error && (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-72 overflow-y-auto">
          {products.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <>
              {products.map((product, index) => {
                const isLast = index === products.length - 1;
                return (
                  <div
                    key={product._id}
                    ref={isLast ? lastProductRef : null}
                    onClick={() => handleSelect(product)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-xs font-medium ${
                          product.currentStock <= product.minimumStock 
                            ? 'text-red-500' 
                            : product.currentStock <= product.minimumStock * 2 
                              ? 'text-yellow-500' 
                              : 'text-green-500'
                        }`}>
                          Stock: {product.currentStock}
                        </span>
                        {product.location && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{product.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs font-semibold text-gray-700">Rs. {product.sellingPrice?.toFixed(2) || '0.00'}</p>
                      <span className="text-xs text-gray-400">per unit</span>
                    </div>
                  </div>
                );
              })}
              
              {loadingMore && (
                <div className="px-4 py-3 text-center">
                  <Loader2 className="w-5 h-5 mx-auto text-[#7c4dff] animate-spin" />
                  <p className="text-xs text-gray-400 mt-1">Loading more...</p>
                </div>
              )}

              {!pagination.hasNext && products.length > 0 && (
                <div className="px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-100">
                  {products.length} products loaded
                </div>
              )}

              <div className="px-4 py-2 text-center text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                {pagination.total} total products • Showing {products.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
// SETTINGS MODAL COMPONENT
// ─────────────────────────────────────────────────────────────
function SettingsModal({
  isOpen,
  onClose,
  category,
  settings,
  onSettingsUpdate,
  onRefreshSettings,
  title,
  placeholder
}: {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  settings: string[];
  onSettingsUpdate: (newSettings: string[]) => void;
  onRefreshSettings: (category: string) => void;
  title: string;
  placeholder: string;
}) {
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setLoading(true);
    setError('');
    try {
      await settingService.createSetting({
        category,
        name: newValue.trim()
      });
      onSettingsUpdate([...settings, newValue.trim()]);
      await onRefreshSettings(category);
      setNewValue('');
    } catch (error: any) {
      console.error('Failed to add setting:', error);
      if (error.response?.status === 409) {
        setError(`"${newValue.trim()}" already exists in this category`);
      } else {
        setError(error.message || 'Failed to add setting');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const response = await settingService.getSettings(category);
      const setting = response.find((s: any) => s.name === name);
      if (setting) {
        await settingService.deleteSetting(setting._id);
        onSettingsUpdate(settings.filter(s => s !== name));
        await onRefreshSettings(category);
      }
    } catch (error) {
      console.error('Failed to delete setting:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder={placeholder}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newValue.trim()}
              className="px-4 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {settings.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No settings found</p>
            ) : (
              settings.map((item, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-sm text-gray-700">{item}</span>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTING DROPDOWN WITH ADD BUTTON
// ─────────────────────────────────────────────────────────────
function SettingDropdownWithModal({
  value,
  onChange,
  options,
  category,
  title,
  placeholder,
  label,
  required = false,
  onOpenModal
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  category: string;
  title: string;
  placeholder: string;
  label: string;
  required?: boolean;
  onOpenModal: (category: string, title: string, placeholder: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
        >
          <option value="">{`Select ${label}`}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onOpenModal(category, title, placeholder)}
          className="px-3 py-2.5 border border-dashed border-gray-300 rounded-lg hover:border-[#7c4dff] hover:bg-purple-50 transition-all flex items-center justify-center text-gray-400 hover:text-[#7c4dff]"
          title={`Add new ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATE ORDER FORM
// ─────────────────────────────────────────────────────────────
function CreateOrderForm({ 
  onCancel, 
  onSuccess,
  settings,
  onRefreshSettings
}: { 
  onCancel: () => void; 
  onSuccess: () => void;
  settings: {
    orderTypes: string[];
    priorities: string[];
    sources: string[];
    shippingMethods: string[];
    paymentMethods: string[];
    customerTypes: string[];
  };
  onRefreshSettings: (category: string) => void;
}) {
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);

  // ─── Customer Information ──────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState('Individual');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');

  // ─── Address ──────────────────────────────────────────────
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: 'Pakistan' });
  const [billingAddress, setBillingAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: 'Pakistan' });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // ─── Order Details ────────────────────────────────────────
  const [orderType, setOrderType] = useState('Standard');
  const [priority, setPriority] = useState('Medium');
  const [source, setSource] = useState('Web');
  const [salesPerson, setSalesPerson] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // ─── Shipping ─────────────────────────────────────────────
  const [shippingMethod, setShippingMethod] = useState('Standard');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingCost, setShippingCost] = useState(0);

  // ─── Payment ──────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  // ─── Discounts ────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // ─── Notes ────────────────────────────────────────────────
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [tags, setTags] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Settings Modal States ──────────────────────────────
  const [settingsModal, setSettingsModal] = useState<{
    isOpen: boolean;
    category: string;
    title: string;
    placeholder: string;
  }>({
    isOpen: false,
    category: '',
    title: '',
    placeholder: ''
  });

  // ─── Order Items Operations ──────────────────────────────
  const addItem = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (quantity > selectedProduct.currentStock) {
      setError(`Insufficient stock. Available: ${selectedProduct.currentStock}`);
      return;
    }

    const existingItem = orderItems.find(item => item.productId === selectedProduct._id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === selectedProduct._id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: quantity,
        unitPrice: selectedProduct.sellingPrice,
        totalPrice: selectedProduct.sellingPrice * quantity,
        weight: selectedProduct.weight || 0,
        weightUnit: selectedProduct.weightUnit || 'KG',
        dimensions: selectedProduct.dimensions ? `${selectedProduct.dimensions.length}x${selectedProduct.dimensions.width}x${selectedProduct.dimensions.height} ${selectedProduct.dimensions.unit}` : '',
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        notes: ''
      }]);
    }
    setSelectedProduct(null);
    setQuantity(1);
    setError('');
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const items = [...orderItems];
    items[index].quantity = newQuantity;
    items[index].totalPrice = items[index].unitPrice * newQuantity;
    setOrderItems(items);
  };

  // ─── Calculations ─────────────────────────────────────────
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalWeight = orderItems.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  
  let calculatedDiscount = discountAmount;
  if (discountType === 'Percentage' && discountPercentage > 0) {
    calculatedDiscount = (subtotal * discountPercentage) / 100;
  }
  
  const taxTotal = 0;
  const grandTotal = subtotal + taxTotal + shippingCost - calculatedDiscount;

  // ─── Handle Submit ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerName) {
      setError('Customer name is required');
      return;
    }
    if (orderItems.length === 0) {
      setError('Order must have at least one item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        customerType,
        customerCompany,
        customerTaxId,
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        items: orderItems,
        orderType,
        priority,
        source,
        salesPerson,
        expectedDeliveryDate,
        shippingMethod,
        shippingCarrier,
        shippingCost,
        paymentMethod,
        paymentStatus,
        couponCode,
        discountTotal: calculatedDiscount,
        customerNotes,
        internalNotes,
        orderNotes,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        subtotal,
        taxTotal,
        grandTotal,
        totalWeight,
        totalItems,
        orderStatus: 'Pending',
        orderDate: new Date().toISOString(),
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };

      await orderService.createOrder(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category: string, title: string, placeholder: string) => {
    setSettingsModal({ isOpen: true, category, title, placeholder });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-[#7c4dff]" />
          <h2 className="text-lg font-bold text-gray-800">Create New Order</h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* ============================================================ */}
          {/* SECTION 1: CUSTOMER INFORMATION */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#7c4dff]" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <SettingDropdownWithModal
                value={customerType}
                onChange={setCustomerType}
                options={settings.customerTypes}
                category="customerType"
                title="Customer Types"
                placeholder="Enter customer type"
                label="Customer Type"
                onOpenModal={handleOpenModal}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Company name"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tax ID / NTN
                </label>
                <input
                  type="text"
                  placeholder="Tax ID"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 2: ADDRESSES */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7c4dff]" />
              Address Information
            </h3>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="w-4 h-4 text-[#7c4dff] rounded border-gray-300"
              />
              <label className="text-sm text-gray-700">Billing address same as shipping</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Street address"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    >
                      <option>Pakistan</option>
                      <option>China</option>
                      <option>USA</option>
                      <option>UK</option>
                      <option>UAE</option>
                      <option>Turkey</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Billing Address</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Street address"
                    value={sameAsShipping ? shippingAddress.street : billingAddress.street}
                    onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                    disabled={sameAsShipping}
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={sameAsShipping ? shippingAddress.city : billingAddress.city}
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={sameAsShipping ? shippingAddress.state : billingAddress.state}
                      onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={sameAsShipping ? shippingAddress.postalCode : billingAddress.postalCode}
                      onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <select
                      value={sameAsShipping ? shippingAddress.country : billingAddress.country}
                      onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option>Pakistan</option>
                      <option>China</option>
                      <option>USA</option>
                      <option>UK</option>
                      <option>UAE</option>
                      <option>Turkey</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 3: ORDER ITEMS - WITH INLINE PRODUCT DROPDOWN */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#7c4dff]" />
              Order Items
            </h3>

            {/* Existing Items List */}
            {orderItems.length > 0 && (
              <div className="space-y-2 mb-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span>Rs. {item.unitPrice.toFixed(2)}/unit</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4 text-gray-500" />
                      </button>
                      <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <PlusIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[100px]">
                      <p className="text-sm font-semibold text-gray-700">Rs. {item.totalPrice.toFixed(2)}</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Item Row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <ProductSearchDropdown
                  onSelect={setSelectedProduct}
                  selectedProduct={selectedProduct}
                  placeholder="Search product by name or SKU..."
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 text-center"
                />
              </div>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Selected Product Preview */}
            {selectedProduct && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedProduct.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>SKU: {selectedProduct.sku}</span>
                    <span>•</span>
                    <span>Price: Rs. {selectedProduct.sellingPrice}</span>
                    <span>•</span>
                    <span className={selectedProduct.currentStock > 0 ? 'text-green-600' : 'text-red-600'}>
                      Stock: {selectedProduct.currentStock}
                    </span>
                    {selectedProduct.location && (
                      <>
                        <span>•</span>
                        <span>Location: {selectedProduct.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Empty State */}
            {orderItems.length === 0 && !selectedProduct && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg mt-4">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No items added yet. Search and add products above.</p>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* SECTION 4: ORDER DETAILS */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#7c4dff]" />
              Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SettingDropdownWithModal
                value={orderType}
                onChange={setOrderType}
                options={settings.orderTypes}
                category="orderType"
                title="Order Types"
                placeholder="Enter order type"
                label="Order Type"
                onOpenModal={handleOpenModal}
              />
              <SettingDropdownWithModal
                value={priority}
                onChange={setPriority}
                options={settings.priorities}
                category="priority"
                title="Priority Levels"
                placeholder="Enter priority"
                label="Priority"
                onOpenModal={handleOpenModal}
              />
              <SettingDropdownWithModal
                value={source}
                onChange={setSource}
                options={settings.sources}
                category="orderSource"
                title="Order Sources"
                placeholder="Enter source"
                label="Order Source"
                onOpenModal={handleOpenModal}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Sales Person
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Sales person name"
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Expected Delivery Date
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g., urgent, bulk, express"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 5: SHIPPING & PAYMENT */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#7c4dff]" />
                  Shipping Information
                </h3>
                <div className="space-y-3">
                  <SettingDropdownWithModal
                    value={shippingMethod}
                    onChange={setShippingMethod}
                    options={settings.shippingMethods}
                    category="shippingMethod"
                    title="Shipping Methods"
                    placeholder="Enter shipping method"
                    label="Shipping Method"
                    onOpenModal={handleOpenModal}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Shipping Carrier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., DHL, FedEx, TCS"
                      value={shippingCarrier}
                      onChange={(e) => setShippingCarrier(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Shipping Cost (Rs.)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7c4dff]" />
                  Payment Information
                </h3>
                <div className="space-y-3">
                  <SettingDropdownWithModal
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    options={settings.paymentMethods}
                    category="paymentMethod"
                    title="Payment Methods"
                    placeholder="Enter payment method"
                    label="Payment Method"
                    onOpenModal={handleOpenModal}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    >
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Partial</option>
                      <option>Refunded</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 6: DISCOUNTS */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-[#7c4dff]" />
              Discounts & Promotions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                >
                  <option>Percentage</option>
                  <option>Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {discountType === 'Percentage' ? 'Discount %' : 'Discount Amount'}
                </label>
                <input
                  type="number"
                  placeholder={discountType === 'Percentage' ? '10' : '100'}
                  value={discountType === 'Percentage' ? discountPercentage : discountAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (discountType === 'Percentage') {
                      setDiscountPercentage(val);
                    } else {
                      setDiscountAmount(val);
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 7: NOTES */}
          {/* ============================================================ */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7c4dff]" />
              Notes & Instructions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Customer Notes
                </label>
                <textarea
                  placeholder="Special instructions from customer"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  placeholder="Internal team notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 8: ORDER SUMMARY */}
          {/* ============================================================ */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#7c4dff]" />
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Cost</span>
                <span className="font-medium">Rs. {shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">Rs. {taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">- Rs. {calculatedDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-[#7c4dff]">Rs. {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Total Items: {totalItems}</span>
                <span>Total Weight: {totalWeight.toFixed(2)} KG</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* FORM ACTIONS */}
          {/* ============================================================ */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || orderItems.length === 0}
              className="px-6 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Create Order
            </button>
          </div>
        </form>
      </div>

      {/* ─── Settings Modal ────────────────────────────────── */}
      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={() => setSettingsModal({ isOpen: false, category: '', title: '', placeholder: '' })}
        category={settingsModal.category}
        settings={(() => {
          switch (settingsModal.category) {
            case 'orderType': return settings.orderTypes;
            case 'priority': return settings.priorities;
            case 'orderSource': return settings.sources;
            case 'shippingMethod': return settings.shippingMethods;
            case 'paymentMethod': return settings.paymentMethods;
            case 'customerType': return settings.customerTypes;
            default: return [];
          }
        })()}
        onSettingsUpdate={(newSettings) => {
          // Handle settings update
        }}
        onRefreshSettings={onRefreshSettings}
        title={settingsModal.title}
        placeholder={settingsModal.placeholder}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDER DETAILS MODAL
// ─────────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Packed: 'bg-purple-100 text-purple-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    'In Transit': 'bg-cyan-100 text-cyan-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Returned: 'bg-orange-100 text-orange-700',
    'On Hold': 'bg-pink-100 text-pink-700',
  };

  const paymentStatusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Paid: 'bg-green-100 text-green-700',
    Partial: 'bg-blue-100 text-blue-700',
    Refunded: 'bg-orange-100 text-orange-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const priorityColors: Record<string, string> = {
    Low: 'bg-gray-100 text-gray-700',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700',
  };

  const StatusBadge = ({ status, colors }: { status: string; colors: Record<string, string> }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{order.orderNumber || 'N/A'}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <StatusBadge status={order.orderStatus} colors={statusColors} />
                <StatusBadge status={order.paymentStatus} colors={paymentStatusColors} />
                <StatusBadge status={order.priority || 'Medium'} colors={priorityColors} />
                <span className="text-xs text-gray-400">• {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-all text-gray-500"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="font-semibold text-gray-800">{order.customerName || 'N/A'}</p>
              <p className="text-xs text-gray-500">{order.customerType || 'Individual'}</p>
              {order.customerCompany && (
                <p className="text-xs text-gray-500">{order.customerCompany}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Contact</p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {order.customerEmail || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {order.customerPhone || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Order Details</p>
              <p className="text-sm text-gray-600">Type: {order.orderType || 'Standard'}</p>
              <p className="text-sm text-gray-600">Source: {order.source || 'Web'}</p>
              <p className="text-sm text-gray-600">Sales: {order.salesPerson || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Shipping</p>
              <p className="text-sm text-gray-600">{order.shippingMethod || 'Standard'}</p>
              {order.shippingCarrier && (
                <p className="text-sm text-gray-600">Carrier: {order.shippingCarrier}</p>
              )}
              {order.trackingNumber && (
                <p className="text-sm text-gray-600">Tracking: {order.trackingNumber}</p>
              )}
              {order.expectedDeliveryDate && (
                <p className="text-sm text-gray-600">Expected: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.shippingAddress && (
              <div className="p-4 border border-gray-100 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Shipping Address
                </h4>
                <p className="text-sm text-gray-700">{order.shippingAddress.street || 'N/A'}</p>
                <p className="text-sm text-gray-700">
                  {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''} {order.shippingAddress.postalCode || ''}
                </p>
                <p className="text-sm text-gray-700">{order.shippingAddress.country || 'N/A'}</p>
              </div>
            )}
            {order.billingAddress && (
              <div className="p-4 border border-gray-100 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Billing Address
                </h4>
                <p className="text-sm text-gray-700">{order.billingAddress.street || 'N/A'}</p>
                <p className="text-sm text-gray-700">
                  {order.billingAddress.city || ''}, {order.billingAddress.state || ''} {order.billingAddress.postalCode || ''}
                </p>
                <p className="text-sm text-gray-700">{order.billingAddress.country || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#7c4dff]" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">SKU</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500">Qty</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Unit Price</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Total</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-gray-400 text-xs">{index + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">Rs. {item.unitPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-2 text-right font-semibold">Rs. {item.totalPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {item.weight ? `${(item.weight * item.quantity).toFixed(1)} KG` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-right font-semibold">Total</td>
                    <td className="px-4 py-2 text-right font-bold">Rs. {order.subtotal?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-2 text-right text-gray-500 font-semibold">
                      {(order.items || []).reduce((sum, i) => sum + (i.weight || 0) * i.quantity, 0).toFixed(1)} KG
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>Rs. {order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Cost</span>
                  <span>Rs. {order.shippingCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Total</span>
                  <span>Rs. {order.taxTotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600">- Rs. {order.discountTotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t-2 border-gray-200 pt-2 flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-[#7c4dff]">Rs. {order.grandTotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-1">
                  <span>Items: {(order.items || []).reduce((s, i) => s + i.quantity, 0)}</span>
                  <span>Payment: {order.paymentMethod || 'N/A'}</span>
                  <span>Coupon: {order.couponCode || 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {order.tags && order.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {order.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {(order.customerNotes || order.internalNotes || order.orderNotes) && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </h4>
              {order.customerNotes && (
                <p className="text-sm text-gray-700"><strong>Customer:</strong> {order.customerNotes}</p>
              )}
              {order.internalNotes && (
                <p className="text-sm text-gray-700"><strong>Internal:</strong> {order.internalNotes}</p>
              )}
              {order.orderNotes && typeof order.orderNotes === 'string' && (
                <p className="text-sm text-gray-700"><strong>Order:</strong> {order.orderNotes}</p>
              )}
            </div>
          )}

          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex justify-between">
            <span>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
            {order.createdBy && (
              <span>Created By: {typeof order.createdBy === 'object' ? order.createdBy.name : order.createdBy}</span>
            )}
            <span>Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDER LIST VIEW
// ─────────────────────────────────────────────────────────────
function OrderList({ 
  orders, 
  loading, 
  onView, 
  onEdit, 
  onAdd,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onRefresh
}: {
  orders: Order[];
  loading: boolean;
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onAdd: () => void;
  pagination: { page: number; limit: number; total: number; pages: number; hasNext: boolean; hasPrev: boolean };
  onPageChange: (page: number) => void;
  filters: {
    search: string;
    status: string;
    paymentStatus: string;
    orderType: string;
    priority: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
}) {
  const statusOptions = ['all', 'Draft', 'Pending', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Delivered', 'Cancelled', 'Returned', 'On Hold'];
  const paymentOptions = ['all', 'Pending', 'Paid', 'Partial', 'Refunded', 'Cancelled'];
  const typeOptions = ['all', 'Standard', 'Bulk', 'Wholesale', 'Express', 'Pre-Order', 'Backorder'];
  const priorityOptions = ['all', 'Low', 'Medium', 'High', 'Urgent'];

  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Packed: 'bg-purple-100 text-purple-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    'In Transit': 'bg-cyan-100 text-cyan-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Returned: 'bg-orange-100 text-orange-700',
    'On Hold': 'bg-pink-100 text-pink-700',
  };

  const paymentColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Paid: 'bg-green-100 text-green-700',
    Partial: 'bg-blue-100 text-blue-700',
    Refunded: 'bg-orange-100 text-orange-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const priorityColors: Record<string, string> = {
    Low: 'bg-gray-100 text-gray-700',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-[#7c4dff]" />
          Orders
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({pagination.total} orders)
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {paymentOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Payment' : status}
              </option>
            ))}
          </select>
          <select
            value={filters.orderType}
            onChange={(e) => onFilterChange('orderType', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority === 'all' ? 'All Priority' : priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-[#7c4dff] animate-spin" />
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400">Click "Create Order" to add one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-[#7c4dff]">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail || ''}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {order.orderType || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-700">
                      Rs. {order.grandTotal?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {(order.items || []).reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColors[order.priority || 'Medium']}`}>
                        {order.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(order)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(order)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="px-3 py-1 bg-[#7c4dff] text-white rounded-lg">
              {pagination.page}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ─── Pagination ────────────────────────────────────────────
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false
  });

  // ─── Filters ──────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    orderType: 'all',
    priority: 'all'
  });

  // ─── Settings ──────────────────────────────────────────────
  const [settings, setSettings] = useState<{
    orderTypes: string[];
    priorities: string[];
    sources: string[];
    shippingMethods: string[];
    paymentMethods: string[];
    customerTypes: string[];
  }>({
    orderTypes: ['Standard', 'Bulk', 'Wholesale', 'Express', 'Pre-Order', 'Backorder'],
    priorities: ['Low', 'Medium', 'High', 'Urgent'],
    sources: ['Web', 'Mobile', 'In-Store', 'Phone', 'WhatsApp', 'Email', 'B2B Portal'],
    shippingMethods: ['Standard', 'Express', 'Same Day', 'Next Day', 'Pickup', 'Freight'],
    paymentMethods: ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Online', 'COD'],
    customerTypes: ['Individual', 'Business', 'Wholesale', 'Distributor', 'Retailer', 'Manufacturer']
  });

  // ─── Fetch Orders ──────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        orderType: filters.orderType !== 'all' ? filters.orderType : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      setOrders(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        pages: response.pagination.pages,
        hasNext: response.pagination.hasNext,
        hasPrev: response.pagination.hasPrev
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // ─── Fetch Settings ──────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      const categories = ['orderType', 'priority', 'orderSource', 'shippingMethod', 'paymentMethod', 'customerType'];
      const results = await Promise.all(
        categories.map(cat => settingService.getSettings(cat))
      );
      
      setSettings({
        orderTypes: results[0]?.map((s: any) => s.name) || settings.orderTypes,
        priorities: results[1]?.map((s: any) => s.name) || settings.priorities,
        sources: results[2]?.map((s: any) => s.name) || settings.sources,
        shippingMethods: results[3]?.map((s: any) => s.name) || settings.shippingMethods,
        paymentMethods: results[4]?.map((s: any) => s.name) || settings.paymentMethods,
        customerTypes: results[5]?.map((s: any) => s.name) || settings.customerTypes
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  // ─── Refresh Settings for a specific category ────────────
  const handleRefreshSettings = useCallback(async (category: string) => {
    try {
      const result = await settingService.getSettings(category);
      const names = result.map((s: any) => s.name);
      
      setSettings(prev => {
        const newSettings = { ...prev };
        switch (category) {
          case 'orderType':
            newSettings.orderTypes = names.length > 0 ? names : prev.orderTypes;
            break;
          case 'priority':
            newSettings.priorities = names.length > 0 ? names : prev.priorities;
            break;
          case 'orderSource':
            newSettings.sources = names.length > 0 ? names : prev.sources;
            break;
          case 'shippingMethod':
            newSettings.shippingMethods = names.length > 0 ? names : prev.shippingMethods;
            break;
          case 'paymentMethod':
            newSettings.paymentMethods = names.length > 0 ? names : prev.paymentMethods;
            break;
          case 'customerType':
            newSettings.customerTypes = names.length > 0 ? names : prev.customerTypes;
            break;
        }
        return newSettings;
      });
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleEdit = (order: Order) => {
    console.log('Edit order:', order);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchOrders();
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/warehouse/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
      </div>

      {showCreateForm ? (
        <CreateOrderForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
          settings={settings}
          onRefreshSettings={handleRefreshSettings}
        />
      ) : (
        <OrderList
          orders={orders}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onAdd={() => setShowCreateForm(true)}
          pagination={pagination}
          onPageChange={handlePageChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
        />
      )}

      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}