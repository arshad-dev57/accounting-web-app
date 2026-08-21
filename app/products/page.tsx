'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit, Trash2, Eye, Package, ChevronDown,
  X, Save, AlertCircle, Info, FileText, Truck,
  DollarSign, Box, Tag, Building2, Calendar, MapPin,
  Layers, Scale, Ruler, Award, Shield, Clock, Upload,
  Image as ImageIcon, Link as LinkIcon, Hash, Type, AlignLeft,
  Settings, Loader2, ChevronLeft, ChevronRight, Barcode,
  Camera, Download, Printer, CheckCircle, XCircle, ZoomIn,
  Thermometer, Package2, ShoppingCart, RotateCcw, Star,
  Globe, AlertTriangle, Archive, Boxes, Home, Headset, Phone, ChevronDown as ChevronDownIcon, CreditCard
} from 'lucide-react';
import { productService, Product, getProductId } from '../api/product/route';
import { categoryService, Category } from '../api/category/route';
import { supplierService, Supplier } from '../api/supplier/route';
import { settingService } from '../api/settings/route';
import { ProductTaxFields } from '../../components/TaxRateSelect';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { usePermissions } from '../../lib/usePermissions';

function resolveCategorySelection(categories: Category[], categoryId?: string) {
  if (!categoryId) return { category: '', subCategory: '', subCategories: [] as Category[] };
  for (const parent of categories) {
    const parentId = parent.id || parent._id;
    const children = parent.children || parent.subCategories || [];
    const child = children.find((c) => (c.id || c._id) === categoryId);
    if (child) {
      return {
        category: parentId || '',
        subCategory: (child.id || child._id) || '',
        subCategories: children,
      };
    }
    if (parentId === categoryId) {
      return { category: parentId, subCategory: '', subCategories: children };
    }
  }
  return { category: categoryId, subCategory: '', subCategories: [] as Category[] };
}

function buildProductFormState(editingProduct?: Product | null, categories: Category[] = []) {
  const catSel = resolveCategorySelection(categories, editingProduct?.categoryId);
  const tags = editingProduct?.tags;
  const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags ? String(tags) : '');

  return {
    name: editingProduct?.name || '',
    sku: editingProduct?.sku || '',
    barcode: editingProduct?.barcode?.number || editingProduct?.barcodeNumber || '',
    productType: editingProduct?.productType || '',
    description: editingProduct?.description || '',
    tags: tagsStr,
    costPrice: editingProduct?.costPrice ?? '',
    sellingPrice: editingProduct?.sellingPrice ?? '',
    landingCost: editingProduct?.landingCost ?? '',
    currency: editingProduct?.currency || editingProduct?.currencyCode || 'PKR',
    taxRate: editingProduct?.taxRate ?? '',
    taxType: editingProduct?.taxType || editingProduct?.taxTypeName || '',
    stockUnit: editingProduct?.stockUnit || editingProduct?.stockUnitName || '',
    currentStock: editingProduct?.currentStock ?? '',
    minimumStock: editingProduct?.minimumStock ?? '',
    maximumStock: editingProduct?.maximumStock ?? '',
    category: catSel.category,
    subCategory: catSel.subCategory,
    brand: editingProduct?.brand || editingProduct?.brandName || '',
    modelNumber: editingProduct?.modelNumber || '',
    supplier: editingProduct?.supplierId || '',
    supplierSku: editingProduct?.supplierSku || '',
    leadTime: editingProduct?.leadTime ?? editingProduct?.leadTimeDays ?? '',
    reorderPoint: editingProduct?.reorderPoint ?? '',
    rackLocation: editingProduct?.rackLocation || editingProduct?.location || '',
    zone: editingProduct?.zone || editingProduct?.zoneName || '',
    palletNumber: editingProduct?.palletNumber || '',
    shelfNumber: editingProduct?.shelfNumber || '',
    storageCondition: editingProduct?.storageCondition || editingProduct?.storageConditionName || '',
    tempMin: editingProduct?.tempMin ?? editingProduct?.temperatureMin ?? '',
    tempMax: editingProduct?.tempMax ?? editingProduct?.temperatureMax ?? '',
    weight: editingProduct?.weight ?? '',
    weightUnit: editingProduct?.weightUnit || editingProduct?.weightUnitName || '',
    length: editingProduct?.length ?? '',
    width: editingProduct?.width ?? '',
    height: editingProduct?.height ?? '',
    dimensionUnit: editingProduct?.dimensionUnit || editingProduct?.dimensionUnitName || '',
    color: editingProduct?.color || '',
    size: editingProduct?.size || '',
    material: editingProduct?.material || '',
    finish: editingProduct?.finish || '',
    hasExpiry: !!editingProduct?.hasExpiry,
    isBatchManaged: !!editingProduct?.isBatchManaged,
    isSerialManaged: !!editingProduct?.isSerialManaged,
    isExpiryManaged: !!editingProduct?.isExpiryManaged,
    expiryDate: editingProduct?.expiryDate ? String(editingProduct.expiryDate).slice(0, 10) : '',
    manufacturingDate: editingProduct?.manufacturingDate ? String(editingProduct.manufacturingDate).slice(0, 10) : '',
    batchNumber: editingProduct?.batchNumber || '',
    shelfLife: editingProduct?.shelfLife ?? editingProduct?.shelfLifeDays ?? '',
    hsCode: editingProduct?.hsCode || '',
    countryOfOrigin: editingProduct?.countryOfOrigin || editingProduct?.countryOfOriginName || 'Pakistan',
    shippingClass: editingProduct?.shippingClass || '',
    freightClass: editingProduct?.freightClass || '',
    stackingLimit: editingProduct?.stackingLimit ?? '',
    dangerousGoods: !!editingProduct?.dangerousGoods,
    unNumber: editingProduct?.unNumber || '',
    handlingInstructions: editingProduct?.handlingInstructions || '',
    warrantyPeriod: editingProduct?.warrantyPeriod ?? '',
    warrantyUnit: editingProduct?.warrantyUnit || 'Months',
    isReturnable: editingProduct?.isReturnable !== false,
    returnDays: editingProduct?.returnDays ?? '7',
    isBulkManaged: !!editingProduct?.isBulkManaged,
    hasIndividualTracking: !!editingProduct?.hasIndividualTracking,
    bulkUnit: editingProduct?.bulkUnit || 'Bale',
    defaultBatchQuantity: editingProduct?.defaultBatchQuantity ?? editingProduct?.defaultQuantityPerBatch ?? '',
    videoUrl: editingProduct?.videoUrl || '',
  };
}

// ============================================================
// BARCODE GENERATOR COMPONENT
// ============================================================
function BarcodeDisplay({ value, productName }: { value: string; productName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const loadJsBarcode = async () => {
      try {
        // @ts-ignore
        const JsBarcode = (await import('jsbarcode')).default;
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 10,
          background: '#ffffff',
          lineColor: '#1a1a1a',
        });
      } catch (e) {
        setError('Barcode render failed');
      }
    };
    loadJsBarcode();
  }, [value]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `barcode-${productName}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Barcode - ${productName}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}
      p{margin-top:8px;font-size:14px;color:#555;}</style></head>
      <body><img src="${dataUrl}" /><p>${productName}</p></body></html>
    `);
    win.document.close();
    win.print();
  };

  if (!value) return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
      <Barcode className="w-8 h-8 mb-2" />
      <p className="text-sm">No barcode assigned</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <canvas ref={canvasRef} className="rounded-lg border border-gray-100" />
      )}
      <div className="flex gap-2">
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all text-gray-600">
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all text-gray-600">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>
    </div>
  );
}

// ============================================================
// BARCODE SCANNER COMPONENT
// ============================================================
function BarcodeScanner({ onScan, onClose }: { onScan: (value: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    const startScanner = async () => {
      try {
        setScanning(true);
        // @ts-ignore
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const codeReader = new BrowserMultiFormatReader();
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) { setError('No camera found'); setScanning(false); return; }
        const deviceId = devices[devices.length - 1].deviceId;

        const controls = await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result: any, err: any) => {
            if (result && active) {
              active = false;
              onScan(result.getText());
            }
          }
        );
        stopRef.current = () => controls.stop();
      } catch (e: any) {
        setError(e.message || 'Camera access denied');
        setScanning(false);
      }
    };
    startScanner();
    return () => {
      active = false;
      stopRef.current?.();
    };
  }, [onScan]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      stopRef.current?.();
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#014582]" />
            <h3 className="text-base font-bold text-gray-800">Scan Barcode</h3>
          </div>
          <button onClick={() => { stopRef.current?.(); onClose(); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-24 border-2 border-[#014582] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
              {scanning && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" /> Scanning...
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">or enter manually</span></div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type barcode..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
            <button onClick={handleManualSubmit} className="px-4 py-2 bg-[#014582] text-white text-sm font-medium rounded-lg hover:bg-[#01366a] transition-all">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT DETAIL VIEW
// ============================================================
function ProductDetail({ product, onClose, onEdit }: { product: Product; onClose: () => void; onEdit: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
    { id: 'warehouse', label: 'Warehouse', icon: MapPin },
    { id: 'physical', label: 'Physical', icon: Ruler },
    { id: 'batch', label: 'Batch & Expiry', icon: Clock },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'barcode', label: 'Barcode', icon: Barcode },
  ];

  const stockStatus =
    product.currentStock === 0
      ? { label: 'Out of Stock', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
      : product.currentStock <= (product.minimumStock || 5)
      ? { label: 'Low Stock', cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' }
      : { label: 'In Stock', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' };

  const DetailRow = ({ label, value, mono = false }: { label: string; value?: any; mono?: boolean }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider w-40 flex-shrink-0">{label}</span>
      <span className={`text-sm text-gray-800 text-right ${mono ? 'font-mono font-semibold' : 'font-medium'}`}>
        {value !== undefined && value !== null && value !== '' ? String(value) : <span className="text-gray-300">—</span>}
      </span>
    </div>
  );

  const Badge = ({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) => {
    const colors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-600',
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      red: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
        {children}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#014582]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#014582] bg-[#014582]/10 px-2 py-0.5 rounded">{product.sku}</span>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${stockStatus.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`} />
                  {stockStatus.label}
                </span>
                {product.productType && <Badge color="blue">{product.productType}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2 bg-[#014582] text-white text-sm font-semibold rounded-lg hover:bg-[#01366a] transition-all">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: 'Cost Price', value: `Rs. ${Number(product.costPrice || 0).toLocaleString()}`, icon: DollarSign, color: 'text-blue-600' },
            { label: 'Selling Price', value: `Rs. ${Number(product.sellingPrice || 0).toLocaleString()}`, icon: ShoppingCart, color: 'text-green-600' },
            { label: 'Current Stock', value: `${Number(product.currentStock || 0).toLocaleString()} ${product.stockUnit || 'Pcs'}`, icon: Boxes, color: 'text-purple-600' },
            { label: 'Min Stock', value: `${Number(product.minimumStock || 0).toLocaleString()} ${product.stockUnit || 'Pcs'}`, icon: AlertTriangle, color: 'text-orange-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs text-gray-400 font-medium">{label}</span>
              </div>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                  ${isActive ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#014582]' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {(product.mainImage || (product.images && product.images.length > 0)) && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Images</h4>
                  <div className="flex flex-wrap gap-3">
                    {(product.images && product.images.length > 0 ? product.images : [product.mainImage!]).map((url, idx) => (
                      <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={url} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Basic Info</h4>
                <DetailRow label="Product Name" value={product.name} />
                <DetailRow label="SKU" value={product.sku} mono />
                <DetailRow label="Product Type" value={product.productType} />
                <DetailRow label="Category" value={product.categoryName} />
                <DetailRow label="Supplier" value={product.supplierName} />
                <DetailRow label="Brand" value={product.brand} />
                <DetailRow label="Model No." value={product.modelNumber} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h4>
                {product.description ? (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{product.description}</p>
                ) : (
                  <p className="text-sm text-gray-300 italic">No description provided</p>
                )}
                {product.tags && (
                  <div className="pt-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(product.tags) ? product.tags : (product.tags ? String(product.tags).split(',') : [])).map((tag: string) => (
                        <span key={tag.trim()} className="text-xs bg-[#014582]/10 text-[#014582] font-medium px-2 py-0.5 rounded-full">{tag.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* ── PRICING & STOCK ── */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pricing</h4>
                <DetailRow label="Cost Price" value={`Rs. ${Number(product.costPrice || 0).toLocaleString()}`} />
                <DetailRow label="Selling Price" value={`Rs. ${Number(product.sellingPrice || 0).toLocaleString()}`} />
                <DetailRow label="Landing Cost" value={product.landingCost ? `Rs. ${Number(product.landingCost).toLocaleString()}` : undefined} />
                <DetailRow label="Currency" value={product.currency || 'PKR'} />
                <DetailRow label="Tax Rate" value={product.taxRate ? `${product.taxRate}%` : undefined} />
                <DetailRow label="Tax Type" value={product.taxType} />
                {product.costPrice && product.sellingPrice && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-0.5">Profit Margin</p>
                    <p className="text-lg font-bold text-green-700">
                      {(((Number(product.sellingPrice) - Number(product.costPrice)) / Number(product.costPrice)) * 100).toFixed(1)}%
                      <span className="text-sm font-normal ml-2 text-green-600">
                        (Rs. {(Number(product.sellingPrice) - Number(product.costPrice)).toLocaleString()})
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Stock Levels</h4>
                <DetailRow label="Stock Unit" value={product.stockUnit} />
                <DetailRow label="Current Stock" value={`${Number(product.currentStock || 0).toLocaleString()} ${product.stockUnit || ''}`} />
                <DetailRow label="Minimum Stock" value={`${Number(product.minimumStock || 0).toLocaleString()} ${product.stockUnit || ''}`} />
                <DetailRow label="Maximum Stock" value={product.maximumStock ? `${Number(product.maximumStock).toLocaleString()} ${product.stockUnit || ''}` : undefined} />
                <DetailRow label="Reorder Point" value={product.reorderPoint} />
                <DetailRow label="Lead Time" value={product.leadTime ? `${product.leadTime} days` : undefined} />
                {product.maximumStock && product.currentStock !== undefined && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Stock Level</span>
                      <span>{Math.round((Number(product.currentStock) / Number(product.maximumStock)) * 100)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          product.currentStock <= (product.minimumStock || 5) ? 'bg-orange-400' :
                          product.currentStock === 0 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (Number(product.currentStock) / Number(product.maximumStock)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span><span>Min: {product.minimumStock}</span><span>Max: {product.maximumStock}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── WAREHOUSE ── */}
          {activeTab === 'warehouse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Location</h4>
                <DetailRow label="Rack Location" value={product.location || product.rackLocation} />
                <DetailRow label="Zone" value={product.zone} />
                <DetailRow label="Pallet Number" value={product.palletNumber} />
                <DetailRow label="Shelf Number" value={product.shelfNumber} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Storage</h4>
                <DetailRow label="Storage Condition" value={product.storageCondition} />
                <DetailRow label="Temp Min" value={product.tempMin !== undefined ? `${product.tempMin}°C` : undefined} />
                <DetailRow label="Temp Max" value={product.tempMax !== undefined ? `${product.tempMax}°C` : undefined} />
              </div>
            </div>
          )}

          {/* ── PHYSICAL ── */}
          {activeTab === 'physical' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dimensions & Weight</h4>
                <DetailRow label="Weight" value={product.weight ? `${product.weight} ${product.weightUnit || 'KG'}` : undefined} />
                <DetailRow label="Length" value={product.length ? `${product.length} ${product.dimensionUnit || 'cm'}` : undefined} />
                <DetailRow label="Width" value={product.width ? `${product.width} ${product.dimensionUnit || 'cm'}` : undefined} />
                <DetailRow label="Height" value={product.height ? `${product.height} ${product.dimensionUnit || 'cm'}` : undefined} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attributes</h4>
                <DetailRow label="Color" value={product.color} />
                <DetailRow label="Size" value={product.size} />
                <DetailRow label="Material" value={product.material} />
                <DetailRow label="Finish" value={product.finish} />
              </div>
            </div>
          )}

          {/* ── BATCH & EXPIRY ── */}
          {activeTab === 'batch' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tracking Flags</h4>
                {[
                  { label: 'Has Expiry', value: product.hasExpiry },
                  { label: 'Batch Managed', value: product.isBatchManaged },
                  { label: 'Serial Managed', value: product.isSerialManaged },
                  { label: 'Expiry Managed', value: product.isExpiryManaged },
                  { label: 'Bulk Managed', value: product.isBulkManaged },
                  { label: 'Individual Tracking', value: product.hasIndividualTracking },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                    {value ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> No
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dates & Batch</h4>
                <DetailRow label="Batch Number" value={product.batchNumber} mono />
                <DetailRow label="Mfg. Date" value={product.manufacturingDate ? new Date(product.manufacturingDate).toLocaleDateString() : undefined} />
                <DetailRow label="Expiry Date" value={product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : undefined} />
                <DetailRow label="Shelf Life" value={product.shelfLife ? `${product.shelfLife} days` : undefined} />
                <DetailRow label="Bulk Unit" value={product.bulkUnit} />
                <DetailRow label="Default Batch Qty" value={product.defaultBatchQuantity} />
              </div>
            </div>
          )}

          {/* ── SHIPPING ── */}
          {activeTab === 'shipping' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Shipping Info</h4>
                <DetailRow label="HS Code" value={product.hsCode} mono />
                <DetailRow label="Country of Origin" value={product.countryOfOrigin} />
                <DetailRow label="Shipping Class" value={product.shippingClass} />
                <DetailRow label="Freight Class" value={product.freightClass} />
                <DetailRow label="Stacking Limit" value={product.stackingLimit} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Safety & Returns</h4>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Dangerous Goods</span>
                  {product.dangerousGoods ? (
                    <Badge color="red">⚠ Yes</Badge>
                  ) : (
                    <Badge color="green">Safe</Badge>
                  )}
                </div>
                <DetailRow label="UN Number" value={product.unNumber} mono />
                <DetailRow label="Handling" value={product.handlingInstructions} />
                <DetailRow label="Warranty" value={product.warrantyPeriod ? `${product.warrantyPeriod} ${product.warrantyUnit || 'Months'}` : undefined} />
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Returnable</span>
                  {product.isReturnable ? (
                    <Badge color="green">Yes — {product.returnDays || 7} days</Badge>
                  ) : (
                    <Badge color="red">No</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── BARCODE ── */}
          {activeTab === 'barcode' && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Barcode</h4>
                <BarcodeDisplay
                  value={product.barcode?.number || product.barcodeNumber || product.sku}
                  productName={product.name}
                />
                <div className="mt-4 space-y-1">
                  <DetailRow label="Barcode No." value={product.barcode?.number || product.barcodeNumber || product.sku} mono />
                  <DetailRow label="Format" value="CODE128" />
                  <DetailRow label="SKU" value={product.sku} mono />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT LIST VIEW
// ============================================================
function ProductList({
  products, loading, pagination, searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory, selectedStatus, setSelectedStatus,
  onPageChange, onAddClick, onEditClick, onDeleteClick, onViewClick,
  onScanClick, categories,
}: {
  products: Product[];
  loading: boolean;
  pagination: { page: number; limit: number; total: number; pages: number; hasNext: boolean; hasPrev: boolean };
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  onPageChange: (page: number) => void;
  onAddClick: () => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (id: string) => void;
  onViewClick: (product: Product) => void;
  onScanClick: () => void;
  categories: Category[];
}) {
  const catOptions = [
    { label: 'All', value: 'all' },
    ...categories.map((c) => ({
      label: c.name,
      value: c.id || c._id || c.name,
    })),
  ];
  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'In Stock', value: 'in' },
    { label: 'Low Stock', value: 'low' },
    { label: 'Out of Stock', value: 'out' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-[#014582]" />
          Products
          <span className="text-sm font-normal text-gray-400 ml-2">({pagination.total} items)</span>
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={onScanClick} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all">
            <Camera className="w-4 h-4" /> Scan
          </button>
          <Link href="/warehouse/product-settings" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all">
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <button onClick={onAddClick} className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search products..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none" />
          </div>
          <div className="relative">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
              {catOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                  <p className="mt-2 text-gray-500">Loading...</p>
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No products found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                </td></tr>
              ) : (
                products.map((product, index) => (
                  <tr key={getProductId(product) || index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{product.sku}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-6 py-3 text-gray-600">{product.categoryName || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{product.supplierName || '-'}</td>
                    <td className="px-6 py-3 font-semibold text-gray-700">Rs. {Number(product.sellingPrice).toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-600">{Number(product.currentStock).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        product.currentStock === 0 ? 'bg-red-100 text-red-700' :
                        product.currentStock <= (product.minimumStock || 5) ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {product.currentStock === 0 ? 'Out of Stock' :
                         product.currentStock <= (product.minimumStock || 5) ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onViewClick(product)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEditClick(product)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const id = getProductId(product);
                            if (id) onDeleteClick(id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
          </p>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrev} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">
              {pagination.page} / {pagination.pages}
            </span>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNext} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CREATE/EDIT PRODUCT FORM (TAB-BASED)
// ============================================================
function ProductForm({
  editingProduct, onCancel, onSuccess, categories, suppliers, settingsData, loadingSettings,
}: {
  editingProduct?: Product | null;
  onCancel: () => void;
  onSuccess: () => void;
  categories: Category[];
  suppliers: Supplier[];
  settingsData: Record<string, any[]>;
  loadingSettings: boolean;
}) {
  const categoryList = Array.isArray(categories) ? categories : [];
  const supplierList = Array.isArray(suppliers) ? suppliers : [];
  const isEditing = !!editingProduct;
  const productId = getProductId(editingProduct);

  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(() => buildProductFormState(editingProduct, categoryList));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    () => editingProduct?.images || (editingProduct?.mainImage ? [editingProduct.mainImage] : [])
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [subCategories, setSubCategories] = useState<Category[]>(() => {
    return resolveCategorySelection(categoryList, editingProduct?.categoryId).subCategories;
  });

  useEffect(() => {
    setFormData(buildProductFormState(editingProduct, categoryList));
    setSubCategories(resolveCategorySelection(categoryList, editingProduct?.categoryId).subCategories);
    setExistingImages(editingProduct?.images || (editingProduct?.mainImage ? [editingProduct.mainImage] : []));
    setImageFiles([]);
    setImagePreviews([]);
  }, [editingProduct, categories]);

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const totalImageCount = existingImages.length + imageFiles.length;
  const remainingImageSlots = Math.max(0, 5 - totalImageCount);

  const handleAddImageFiles = (fileList: FileList | null) => {
    if (!fileList || remainingImageSlots <= 0) return;
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    setImageFiles((prev) => {
      const slots = Math.max(0, 5 - existingImages.length - prev.length);
      return [...prev, ...incoming.slice(0, slots)];
    });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const productTypes = settingsData.productType || [];
  const stockUnits = settingsData.stockUnit || [];
  const weightUnits = settingsData.weightUnit || [];
  const dimensionUnits = settingsData.dimensionUnit || [];
  const sizes = settingsData.size || [];
  const shippingClasses = settingsData.shippingClass || [];
  const taxTypes = settingsData.taxType || [];
  const rackLocations = settingsData.rackLocation || [];
  const zones = settingsData.zone || [];
  const storageConditions = settingsData.storageCondition || [];

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
    { id: 'category', label: 'Category & Supplier', icon: Building2 },
    { id: 'warehouse', label: 'Warehouse', icon: MapPin },
    { id: 'physical', label: 'Physical Attributes', icon: Ruler },
    { id: 'expiry', label: 'Expiry & Batch', icon: Clock },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'custom', label: 'Custom', icon: Layers },
  ];

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
// In your ProductsPage component

// Then update your handleCategoryChange function:
const handleCategoryChange = (categoryId: string) => {
  console.log('Category selected:', categoryId);
  
  handleInputChange('category', categoryId);
  handleInputChange('subCategory', '');
  
  if (categoryId) {
    // Find the selected category from the already loaded categories
    const selectedCategory = categories.find(c => c._id === categoryId || c.id === categoryId);
    console.log('Selected category:', selectedCategory);
    
    // Get subcategories - check both property names
    const subCats = selectedCategory?.subCategories || selectedCategory?.children || [];
    console.log('Subcategories found:', subCats);
    
    setSubCategories(subCats);
  } else {
    setSubCategories([]);
  }
};
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = new FormData();
      const mapping: Record<string, string> = {
        name: 'name',
        sku: 'sku',
        barcode: 'barcodeNumber',
        description: 'description',
        costPrice: 'costPrice',
        sellingPrice: 'sellingPrice',
        minimumStock: 'minimumStock',
        maximumStock: 'maximumStock',
        supplier: 'supplierId',
        rackLocation: 'location',
        productType: 'productType',
        hsCode: 'hsCode',
        countryOfOrigin: 'countryOfOrigin',
        shippingClass: 'shippingClass',
        freightClass: 'freightClass',
        weight: 'weight',
        length: 'length',
        width: 'width',
        height: 'height',
        color: 'color',
        size: 'size',
        material: 'material',
        finish: 'finish',
        hasExpiry: 'hasExpiry',
        isBatchManaged: 'isBatchManaged',
        isSerialManaged: 'isSerialManaged',
        isExpiryManaged: 'isExpiryManaged',
        expiryDate: 'expiryDate',
        manufacturingDate: 'manufacturingDate',
        batchNumber: 'batchNumber',
        shelfLife: 'shelfLife',
        warrantyPeriod: 'warrantyPeriod',
        warrantyUnit: 'warrantyUnit',
        isReturnable: 'isReturnable',
        returnDays: 'returnDays',
        isBulkManaged: 'isBulkManaged',
        hasIndividualTracking: 'hasIndividualTracking',
        bulkUnit: 'bulkUnit',
        defaultBatchQuantity: 'defaultBatchQuantity',
        stockUnit: 'stockUnit',
        weightUnit: 'weightUnit',
        dimensionUnit: 'dimensionUnit',
        taxType: 'taxType',
        taxRate: 'taxRate',
        zone: 'zone',
        storageCondition: 'storageCondition',
        brand: 'brand',
        modelNumber: 'modelNumber',
        currency: 'currency',
        landingCost: 'landingCost',
        leadTime: 'leadTime',
        reorderPoint: 'reorderPoint',
        supplierSku: 'supplierSku',
        palletNumber: 'palletNumber',
        shelfNumber: 'shelfNumber',
        tempMin: 'tempMin',
        tempMax: 'tempMax',
        dangerousGoods: 'dangerousGoods',
        unNumber: 'unNumber',
        handlingInstructions: 'handlingInstructions',
        stackingLimit: 'stackingLimit',
      };

      Object.entries(mapping).forEach(([front, back]) => {
        const val = formData[front as keyof typeof formData];
        if (val !== undefined && val !== null && val !== '') {
          payload.append(back, String(val));
        }
      });

      const categoryId = formData.subCategory || formData.category;
      if (categoryId) payload.append('categoryId', categoryId);

      if (formData.tags) payload.append('tags', formData.tags);
      payload.append('existingImages', JSON.stringify(existingImages));
      for (const file of imageFiles) payload.append('images', file);

      if (isEditing && productId) {
        await productService.updateProduct(productId, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-[#014582]" />
          <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Product' : 'Create New Product'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/warehouse/product-settings" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all">
            <Settings className="w-3.5 h-3.5" /> Settings
          </Link>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                ${isActive ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#014582]' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="e.g., Cotton - Grade A" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="e.g., COT-001" value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Barcode</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Enter barcode or leave blank to use SKU" value={formData.barcode} onChange={(e) => handleInputChange('barcode', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Leave blank — SKU will be used as barcode automatically</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Type</label>
                <div className="flex gap-2">
                  <select value={formData.productType} onChange={(e) => handleInputChange('productType', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select type...</option>
                    {productTypes.map((type) => <option key={type._id} value={type.name}>{type.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea placeholder="Enter product description..." rows={3} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
                <input type="text" placeholder="e.g., cotton, grade-a, raw-material" value={formData.tags} onChange={(e) => handleInputChange('tags', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
            </div>
          )}

          {/* PRICING & STOCK */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cost Price *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" step="0.01" placeholder="0.00" value={formData.costPrice} onChange={(e) => handleInputChange('costPrice', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" step="0.01" placeholder="0.00" value={formData.sellingPrice} onChange={(e) => handleInputChange('sellingPrice', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Landing Cost</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" step="0.01" placeholder="0.00" value={formData.landingCost} onChange={(e) => handleInputChange('landingCost', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currency *</label>
                <div className="flex gap-2">
                  <select value={formData.currency} onChange={(e) => handleInputChange('currency', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option>PKR</option><option>USD</option><option>EUR</option><option>GBP</option><option>AUD</option>
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div className="md:col-span-2">
                <ProductTaxFields
                  taxRate={formData.taxRate}
                  taxType={formData.taxType}
                  onChange={({ taxRate, taxType }) => {
                    handleInputChange('taxRate', taxRate);
                    handleInputChange('taxType', taxType);
                  }}
                  selectClassName="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Unit</label>
                <div className="flex gap-2">
                  <select value={formData.stockUnit} onChange={(e) => handleInputChange('stockUnit', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select unit...</option>
                    {stockUnits.map((unit) => <option key={unit._id} value={unit.name}>{unit.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {editingProduct ? 'Current Stock (read-only)' : 'Opening Stock'}
                </label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={editingProduct ? (editingProduct.currentStock ?? 0) : 0}
                    readOnly
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                {!editingProduct && (
                  <p className="text-xs text-blue-700 mt-1">
                    Add opening stock via{' '}
                    <Link href="/warehouse/stock-movement" className="underline font-semibold">
                      Stock Movement → Opening Stock
                    </Link>.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Minimum Stock</label>
                <input type="number" placeholder="5" value={formData.minimumStock} onChange={(e) => handleInputChange('minimumStock', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Maximum Stock</label>
                <input type="number" placeholder="100" value={formData.maximumStock} onChange={(e) => handleInputChange('maximumStock', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
            </div>
          )}

        {/* CATEGORY & SUPPLIER */}
{activeTab === 'category' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
      <div className="flex gap-2">
        <select 
          value={formData.category} 
          onChange={(e) => handleCategoryChange(e.target.value)} 
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
          required
        >
          <option value="">Select category...</option>
          {categoryList.map((cat) => (
            <option key={cat._id || cat.id} value={cat._id || cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Link href="/warehouse/categories" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
        </Link>
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sub-Category</label>
      <div className="flex gap-2">
        <select 
          value={formData.subCategory} 
          onChange={(e) => handleInputChange('subCategory', e.target.value)} 
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
          disabled={subCategories.length === 0}
        >
          <option value="">
            {subCategories.length === 0 ? 'No sub-categories available' : 'Select sub-category...'}
          </option>
          {subCategories.map((sub) => (
            <option key={sub._id || sub.id} value={sub._id || sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
        <Link href="/warehouse/categories" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
        </Link>
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
      <input 
        type="text" 
        placeholder="Brand name" 
        value={formData.brand} 
        onChange={(e) => handleInputChange('brand', e.target.value)} 
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
      />
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model Number</label>
      <input 
        type="text" 
        placeholder="Model #" 
        value={formData.modelNumber} 
        onChange={(e) => handleInputChange('modelNumber', e.target.value)} 
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
      />
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier *</label>
      <div className="flex gap-2">
        <select 
          value={formData.supplier} 
          onChange={(e) => handleInputChange('supplier', e.target.value)} 
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
          required
        >
          <option value="">Select supplier...</option>
          {supplierList.map((sup) => (
            <option key={sup._id || sup.id} value={sup._id || sup.id}>
              {sup.name}
            </option>
          ))}
        </select>
        <Link href="/warehouse/suppliers" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
        </Link>
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier SKU</label>
      <input 
        type="text" 
        placeholder="Supplier SKU" 
        value={formData.supplierSku} 
        onChange={(e) => handleInputChange('supplierSku', e.target.value)} 
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
      />
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lead Time (Days)</label>
      <input 
        type="number" 
        placeholder="7" 
        value={formData.leadTime} 
        onChange={(e) => handleInputChange('leadTime', e.target.value)} 
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
      />
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reorder Point</label>
      <input 
        type="number" 
        placeholder="100" 
        value={formData.reorderPoint} 
        onChange={(e) => handleInputChange('reorderPoint', e.target.value)} 
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" 
      />
    </div>
  </div>
)}
          {/* WAREHOUSE */}
          {activeTab === 'warehouse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rack Location</label>
                <div className="flex gap-2">
                  <select value={formData.rackLocation} onChange={(e) => handleInputChange('rackLocation', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select rack...</option>
                    {rackLocations.map((rack) => <option key={rack._id} value={rack.name}>{rack.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zone</label>
                <div className="flex gap-2">
                  <select value={formData.zone} onChange={(e) => handleInputChange('zone', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select zone...</option>
                    {zones.map((zone) => <option key={zone._id} value={zone.name}>{zone.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pallet Number</label>
                <input type="text" placeholder="Pallet #" value={formData.palletNumber} onChange={(e) => handleInputChange('palletNumber', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shelf Number</label>
                <input type="text" placeholder="Shelf #" value={formData.shelfNumber} onChange={(e) => handleInputChange('shelfNumber', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Storage Condition</label>
                <div className="flex gap-2">
                  <select value={formData.storageCondition} onChange={(e) => handleInputChange('storageCondition', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select condition...</option>
                    {storageConditions.map((cond) => <option key={cond._id} value={cond.name}>{cond.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Temp Min (°C)</label>
                  <input type="number" placeholder="0" value={formData.tempMin} onChange={(e) => handleInputChange('tempMin', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Temp Max (°C)</label>
                  <input type="number" placeholder="40" value={formData.tempMax} onChange={(e) => handleInputChange('tempMax', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>
            </div>
          )}

          {/* PHYSICAL ATTRIBUTES */}
          {activeTab === 'physical' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Weight</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="number" step="0.01" placeholder="0.00" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                  </div>
                  <select value={formData.weightUnit} onChange={(e) => handleInputChange('weightUnit', e.target.value)} className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    {weightUnits.map((unit) => <option key={unit._id} value={unit.name}>{unit.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dimension Unit</label>
                <div className="flex gap-2">
                  <select value={formData.dimensionUnit} onChange={(e) => handleInputChange('dimensionUnit', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    {dimensionUnits.map((unit) => <option key={unit._id} value={unit.name}>{unit.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Length</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" placeholder="0" value={formData.length} onChange={(e) => handleInputChange('length', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Width</label>
                <input type="number" placeholder="0" value={formData.width} onChange={(e) => handleInputChange('width', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Height</label>
                <input type="number" placeholder="0" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                <input type="text" placeholder="e.g., White" value={formData.color} onChange={(e) => handleInputChange('color', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Size</label>
                <div className="flex gap-2">
                  <select value={formData.size} onChange={(e) => handleInputChange('size', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select size...</option>
                    {sizes.map((size) => <option key={size._id} value={size.name}>{size.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Material</label>
                <input type="text" placeholder="e.g., 100% Cotton" value={formData.material} onChange={(e) => handleInputChange('material', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Finish</label>
                <input type="text" placeholder="e.g., Matte, Glossy" value={formData.finish} onChange={(e) => handleInputChange('finish', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
            </div>
          )}

          {/* EXPIRY & BATCH */}
          {activeTab === 'expiry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'hasExpiry', label: 'Has Expiry' },
                { key: 'isBatchManaged', label: 'Batch Managed' },
                { key: 'isSerialManaged', label: 'Serial Managed' },
                { key: 'isExpiryManaged', label: 'Expiry Managed' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <input type="checkbox" checked={formData[key as keyof typeof formData] as boolean} onChange={(e) => handleInputChange(key, e.target.checked)} className="w-4 h-4 text-[#014582] rounded border-gray-300" />
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={formData.expiryDate} onChange={(e) => handleInputChange('expiryDate', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Manufacturing Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={formData.manufacturingDate} onChange={(e) => handleInputChange('manufacturingDate', e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batch Number</label>
                <input type="text" placeholder="BATCH-001" value={formData.batchNumber} onChange={(e) => handleInputChange('batchNumber', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shelf Life (Days)</label>
                <input type="number" placeholder="365" value={formData.shelfLife} onChange={(e) => handleInputChange('shelfLife', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Bulk Management (Cotton/Fabric)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.isBulkManaged} onChange={(e) => handleInputChange('isBulkManaged', e.target.checked)} className="w-4 h-4 text-[#014582] rounded border-gray-300" />
                    <label className="text-sm font-medium text-gray-700">Bulk Managed</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.hasIndividualTracking} onChange={(e) => handleInputChange('hasIndividualTracking', e.target.checked)} className="w-4 h-4 text-[#014582] rounded border-gray-300" />
                    <label className="text-sm font-medium text-gray-700">Individual Tracking</label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bulk Unit</label>
                    <select value={formData.bulkUnit} onChange={(e) => handleInputChange('bulkUnit', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                      <option>Bale</option><option>Box</option><option>Roll</option><option>Pallet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Batch Quantity</label>
                    <input type="number" placeholder="50" value={formData.defaultBatchQuantity} onChange={(e) => handleInputChange('defaultBatchQuantity', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">HS Code</label>
                <input type="text" placeholder="e.g., 5201.00.00" value={formData.hsCode} onChange={(e) => handleInputChange('hsCode', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country of Origin</label>
                <select value={formData.countryOfOrigin} onChange={(e) => handleInputChange('countryOfOrigin', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                  <option>Pakistan</option><option>China</option><option>USA</option><option>Turkey</option><option>India</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shipping Class</label>
                <div className="flex gap-2">
                  <select value={formData.shippingClass} onChange={(e) => handleInputChange('shippingClass', e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    <option value="">Select class...</option>
                    {shippingClasses.map((cls) => <option key={cls._id} value={cls.name}>{cls.name}</option>)}
                  </select>
                  <Link href="/warehouse/product-settings" className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
                  </Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Freight Class</label>
                <input type="text" placeholder="Freight class" value={formData.freightClass} onChange={(e) => handleInputChange('freightClass', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stacking Limit</label>
                <input type="number" placeholder="5" value={formData.stackingLimit} onChange={(e) => handleInputChange('stackingLimit', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" checked={formData.dangerousGoods} onChange={(e) => handleInputChange('dangerousGoods', e.target.checked)} className="w-4 h-4 text-[#014582] rounded border-gray-300" />
                <label className="text-sm font-medium text-gray-700">Dangerous Goods</label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">UN Number</label>
                <input type="text" placeholder="UN #" value={formData.unNumber} onChange={(e) => handleInputChange('unNumber', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Handling Instructions</label>
                <input type="text" placeholder="Special handling instructions..." value={formData.handlingInstructions} onChange={(e) => handleInputChange('handlingInstructions', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
              </div>
            </div>
          )}

          {/* MEDIA */}
          {activeTab === 'media' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Product Images</label>
                <span className="text-xs font-medium text-gray-500">{totalImageCount} / 5</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Select multiple images (hold Ctrl/Cmd). First image is the main image. You can also add more in batches.
              </p>

              <div className="flex flex-wrap gap-3 mb-3">
                {existingImages.map((url, idx) => (
                  <div key={`existing-${url}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && imageFiles.length === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#014582] text-white px-1.5 py-0.5 rounded">Main</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setExistingImages((prev) => prev.filter((u) => u !== url))}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {imagePreviews.map((url, idx) => (
                  <div key={`new-${url}`} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#014582]/40 bg-gray-50">
                    <img src={url} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                    {existingImages.length === 0 && idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#014582] text-white px-1.5 py-0.5 rounded">Main</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {remainingImageSlots > 0 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#014582] hover:bg-[#014582]/5 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#014582]"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">Add images</span>
                    <span className="text-[9px]">{remainingImageSlots} left</span>
                  </button>
                )}
              </div>

              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => handleAddImageFiles(e.target.files)}
              />

              {remainingImageSlots > 0 && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-[#014582] hover:text-[#014582] transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Choose multiple images
                </button>
              )}
            </div>
          )}

          {/* CUSTOM */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Custom Attributes</h4>
                  <button type="button" className="text-sm text-[#014582] font-semibold hover:text-[#01366a]">+ Add Field</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Attribute Name" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white" />
                  <input type="text" placeholder="Value" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Warranty & Return</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Warranty Period</label>
                    <input type="number" placeholder="12" value={formData.warrantyPeriod} onChange={(e) => handleInputChange('warrantyPeriod', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Warranty Unit</label>
                    <select value={formData.warrantyUnit} onChange={(e) => handleInputChange('warrantyUnit', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                      <option>Days</option><option>Months</option><option>Years</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.isReturnable} onChange={(e) => handleInputChange('isReturnable', e.target.checked)} className="w-4 h-4 text-[#014582] rounded border-gray-300" />
                    <label className="text-sm font-medium text-gray-700">Is Returnable</label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Return Days</label>
                    <input type="number" placeholder="7" value={formData.returnDays} onChange={(e) => handleInputChange('returnDays', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Notes</h4>
                <textarea placeholder="Enter any additional notes..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white resize-none" />
              </div>
            </div>
          )}

          {/* FORM ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function ProductsPage() {
  const { isAdmin } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settingsData, setSettingsData] = useState<Record<string, any[]>>({});
  const [loadingSettings, setLoadingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const cats = ['productType', 'rackLocation', 'zone', 'weightUnit', 'dimensionUnit', 'size', 'shippingClass', 'stockUnit', 'taxType', 'storageCondition'];
      const results = await Promise.allSettled(cats.map(cat => settingService.getSettings(cat)));
      const map: Record<string, any[]> = {};
      cats.forEach((cat, idx) => {
        if (results[idx].status === 'fulfilled') {
          map[cat] = results[idx].value || [];
        } else {
          console.warn(`Failed to fetch settings for ${cat}:`, results[idx].reason);
          map[cat] = [];
        }
      });
      setSettingsData(map);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setSettingsData({});
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
const fetchDropdowns = async () => {
  try {
    const [cats, supps] = await Promise.all([
      categoryService.getCategories({ tree: true }), // ✅ This fetches with subcategories
      supplierService.getSuppliers({ limit: 100 })
    ]);
    setCategories(Array.isArray(cats) ? cats : []);
    setSuppliers(supps?.data || []);
  } catch (err) {
    console.error('Failed to fetch dropdowns:', err);
  }
};
    fetchDropdowns();
    fetchSettings();
  }, [fetchSettings]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        stockStatus: selectedStatus !== 'all' ? selectedStatus as any : undefined,
      });
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      alert(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleBarcodeScan = useCallback(async (scannedValue: string) => {
    setShowScanner(false);
    setLoading(true);
    try {
      const result = await productService.getProducts({ search: scannedValue, limit: 1 });
      if (result.data.length > 0) {
        setViewingProduct(result.data[0]);
      } else {
        alert(`No product found for barcode: ${scannedValue}`);
      }
    } catch (err: any) {
      alert(err.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (page: number) => setPagination(prev => ({ ...prev, page }));
  const handleSearch = (val: string) => { setSearchTerm(val); setPagination(prev => ({ ...prev, page: 1 })); };
  const handleCategoryChange = (val: string) => { setSelectedCategory(val); setPagination(prev => ({ ...prev, page: 1 })); };
  const handleStatusChange = (val: string) => { setSelectedStatus(val); setPagination(prev => ({ ...prev, page: 1 })); };

  const handleAddClick = () => { setEditingProduct(null); setShowCreateForm(true); };

  const handleViewClick = async (product: Product) => {
    const id = getProductId(product);
    if (!id) {
      setViewingProduct(product);
      return;
    }
    try {
      const full = await productService.getProductById(id);
      setViewingProduct(full);
    } catch (err) {
      console.error('Failed to load product detail:', err);
      setViewingProduct(product);
    }
  };

  const handleEditClick = async (product: Product) => {
    setViewingProduct(null);
    const id = getProductId(product);
    if (!id) {
      setEditingProduct(product);
      setShowCreateForm(true);
      return;
    }
    try {
      const full = await productService.getProductById(id);
      setEditingProduct(full);
    } catch (err) {
      console.error('Failed to load product for edit:', err);
      setEditingProduct(product);
    }
    setShowCreateForm(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await productService.deleteProduct(id); fetchProducts(); }
    catch (error: any) { alert(error.message || 'Failed to delete product'); }
  };
  const handleFormSuccess = () => { setShowCreateForm(false); setEditingProduct(null); fetchProducts(); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
        <BrandHeader subtitle="Products" />

        {/* Menu Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
            NAVIGATION
          </p>
          
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Main Dashboard</span>
          </Link>

          <Link
            href="/warehouse/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Warehouse</span>
          </Link>

          <Link
            href="/accounting/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Accounting</span>
          </Link>

          <Link
            href="/sales/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Sales</span>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="px-3 pb-6 space-y-1">
          {isAdmin && (
            <Link
              href="/plans"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Subscription Plans</span>
            </Link>
          )}
          <Link
            href="/warehouse/product-settings"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Product Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <TopBarBrand
            title="Products Management"
            icon={<Package className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { window.location.href = '/support'; }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Headset className="w-4 h-4" />
              <span>Support</span>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#014582]" />
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-8 h-8 bg-[#014582] rounded-full flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {showScanner && (
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={() => setShowScanner(false)}
              />
            )}

            {viewingProduct && (
              <ProductDetail
                product={viewingProduct}
                onClose={() => setViewingProduct(null)}
                onEdit={() => handleEditClick(viewingProduct)}
              />
            )}

            {showCreateForm ? (
              <ProductForm
                editingProduct={editingProduct}
                onCancel={() => { setShowCreateForm(false); setEditingProduct(null); }}
                onSuccess={handleFormSuccess}
                categories={categories}
                suppliers={suppliers}
                settingsData={settingsData}
                loadingSettings={loadingSettings}
              />
            ) : (
              <ProductList
                products={products}
                loading={loading}
                pagination={pagination}
                searchTerm={searchTerm}
                setSearchTerm={handleSearch}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleCategoryChange}
                selectedStatus={selectedStatus}
                setSelectedStatus={handleStatusChange}
                onPageChange={handlePageChange}
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                onViewClick={handleViewClick}
                onScanClick={() => setShowScanner(true)}
                categories={categories}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}