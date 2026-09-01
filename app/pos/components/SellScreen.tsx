'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { posProductService, posSaleService } from '../../../lib/pos-service';
import { customerService } from '../../../app/api/customer/route';
import { categoryService, Category } from '../../../app/api/category/route';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, DollarSign, Printer, Check, Loader2, Package, User, ChevronDown, Download, Barcode, Nfc, ChevronRight, LayoutGrid } from 'lucide-react';
import { loadPosSettings, loadReceiptTemplate } from '../../../lib/pos-settings';
import {
  attachHidBarcodeScanner,
  beepIfEnabled,
  matchScannedProduct,
  reconnectSerialScanner,
  subscribeBarcodeScans,
} from '../../../lib/pos-scanner';
import {
  cancelPaymentTerminalSale,
  methodNeedsPaymentDevice,
  reconnectPaymentTerminal,
  requestPaymentTerminalSale,
} from '../../../lib/pos-payment-terminal';
import POSReceipt from './POSReceipt';
import {
  barcodePngDataUrl,
  downloadPosReceiptPdf,
  receiptBarcodeValue,
  receiptQrPngDataUrl,
  resolveReceiptCompany,
} from '../../../lib/pos-receipt';
import { kickCashDrawer, printPosReceipt } from '../../../lib/pos-thermal-printer';
import {
  computeTaxLine,
  resolveProductTaxRate,
  taxService,
  type TaxContext,
  type TaxPricingModel,
} from '../../../lib/tax-service';
import { effectiveLocationId } from '../../../lib/location-service';
import { useLocation } from '../../../lib/location-context';
import { useCurrency } from '../../../lib/currency-context';
import { loadCurrencyLocal } from '../../../lib/currency-service';

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('auth_token') ||
    document.cookie.split('; ').find((c) => c.startsWith('auth_token='))?.split('=')[1] ||
    ''
  );
}

function ManagerPinModal({
  open,
  title,
  onCancel,
  onVerified,
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onVerified: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]">
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 w-[400px] max-w-[95vw]">
        <h3 className="text-gray-900 font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-xs mb-4">Enter manager email and password to approve.</p>
        {error && <div className="text-red-600 text-xs mb-3">{error}</div>}
        <input
          className="w-full mb-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
          placeholder="Manager email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full mb-4 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                await posSaleService.verifyManager({ email, password });
                onVerified();
              } catch (e: any) {
                setError(e.message || 'Verification failed');
              } finally {
                setLoading(false);
              }
            }}
            className="flex-1 py-2 rounded-lg bg-[#014582] text-white text-sm font-bold"
          >
            {loading ? 'Checking...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CartItem { productId:string; productName:string; sku:string; barcodeNumber?:string; quantity:number; unitPrice:number; discount:number; taxRate:number; taxAmount:number; lineTotal:number; mainImage?:string; currentStock:number; availableStock?:number; isCustom?: boolean; }
interface Payment {
  paymentMethod: string;
  amount: number;
  reference: string;
  terminalApproved?: boolean;
  cardLast4?: string;
  entryMode?: string;
}
interface Product { id:string; name:string; sku:string; barcodeNumber:string; sellingPrice:number; costPrice:number; currentStock:number; availableStock?:number; mainImage?:string; categoryId?:string; categoryName?:string; taxRate?:number; }
function sellableQty(p: { currentStock?: number; availableStock?: number }) {
  const n = p.availableStock ?? p.currentStock ?? 0;
  return Number.isFinite(n) ? n : 0;
}

function categoryIdOf(cat: Category): string {
  return String(cat.id || cat._id || '');
}

function categoryChildren(cat: Category): Category[] {
  return (cat.children || cat.subCategories || []).filter((c) => !!categoryIdOf(c));
}

function rootCategories(tree: Category[]): Category[] {
  if (!tree.length) return [];
  const hasNested = tree.some((c) => categoryChildren(c).length > 0);
  if (hasNested) return tree.filter((c) => !!categoryIdOf(c));
  return tree.filter((c) => !c.parentId && !!categoryIdOf(c));
}

const PAYMENT_METHODS = ['Cash','Card','Bank Transfer','Mobile Wallet','Cheque'];

function computeLineTotal(qty:number, price:number, discPct:number, taxRate:number, pricingModel: TaxPricingModel = 'exclusive') {
  const { lineTotal, taxAmount } = computeTaxLine(qty, price, discPct, taxRate, pricingModel);
  return { lineTotal, taxAmount };
}

function Keypad({ onKey }: { onKey:(k:string)=>void }) {
  const keys = ['7','8','9','4','5','6','1','2','3','00','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map(k=>(
        <button
          key={k}
          onClick={()=>onKey(k)}
          className={`h-13 rounded-xl font-semibold text-xl cursor-pointer transition-colors ${
            k==='⌫'
              ? 'bg-red-500/15 border border-red-500/30 text-red-600'
              : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-100'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function ReceiptModal({ sale, companyProfile, shift, onClose, onDownloadReport, onSendEmail }: { sale:any; companyProfile:any; shift?:any; onClose:()=>void; onDownloadReport:()=>void; onSendEmail:(email:string)=>void }) {
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printHint, setPrintHint] = useState('');
  const paperRef = useRef<HTMLDivElement | null>(null);
  const autoPrintedRef = useRef(false);

  const handlePrint = async () => {
    if (!paperRef.current) return;
    setPrinting(true);
    setPrintHint('');
    try {
      const result = await printPosReceipt({
        sale,
        companyProfile,
        shift,
        paperNode: paperRef.current,
      });
      if (result.mode === 'escpos') {
        setPrintHint('Sent to thermal printer');
      } else if ((result as any).fallback) {
        setPrintHint('ESC/POS unavailable — opened browser print');
      }
    } catch (e: any) {
      setPrintHint(e?.message || 'Print failed');
      alert(e?.message || 'Print failed');
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    if (autoPrintedRef.current) return;
    const settings = loadPosSettings();
    if (!settings.autoPrintOnSale) return;
    autoPrintedRef.current = true;
    // Wait for barcode/QR images to render on the receipt paper
    const t = setTimeout(() => {
      void handlePrint();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale?.invoiceNumber]);

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setSendingEmail(true);
    try {
      await onSendEmail(emailInput);
      setShowEmailForm(false);
      setEmailInput('');
      alert('Receipt sent successfully!');
    } catch (e) {
      alert('Failed to send receipt');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-3">
      <div className="bg-[#f3f4f6] rounded-2xl p-4 max-w-[460px] w-[95%] max-h-[92vh] overflow-y-auto">
        <div ref={paperRef} className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <POSReceipt sale={sale} companyProfile={companyProfile} shift={shift} />
        </div>
        
        <div className="flex gap-3 mt-5 no-print">
          <button
            onClick={() => void handlePrint()}
            disabled={printing}
            className="flex-1 py-2.5 rounded-lg border-none bg-[#014582] text-white cursor-pointer font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#01366a] disabled:opacity-60"
          >
            {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {printing ? 'Printing…' : 'Print thermal'}
          </button>
          <button onClick={onDownloadReport} className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer font-semibold text-sm flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
        {printHint ? (
          <div className="mt-2 text-center text-xs text-gray-500 no-print">{printHint}</div>
        ) : (
          <div className="mt-2 text-center text-[11px] text-gray-400 no-print">
            Tip: choose your {loadReceiptTemplate().thermalPaperWidthMm}mm thermal printer in the dialog (margins none, no headers)
          </div>
        )}
        
        <div className="flex gap-3 mt-3 no-print">
          <button onClick={()=>setShowEmailForm(!showEmailForm)} className="flex-1 py-2.5 rounded-lg border border-[#014582] bg-[#014582]/5 text-[#014582] cursor-pointer font-semibold text-sm flex items-center justify-center gap-2">
            Send Email
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border-none bg-gray-900 text-white cursor-pointer font-semibold text-sm">Close</button>
        </div>

        {/* Email Form */}
        {showEmailForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 no-print">
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e)=>setEmailInput(e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#014582]"
              />
            </div>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full py-2 rounded-lg bg-[#014582] text-white font-semibold text-sm cursor-pointer hover:bg-[#01366a] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Receipt'
              )}
            </button>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SellScreen({ shift }: { shift: any }) {
  const { locationIdForApi, selectedLocation, isAllLocations } = useLocation();
  const { symbol } = useCurrency();
  const money = (n: number | undefined | null) => `${symbol}${Number(n || 0).toFixed(2)}`;
  const terminalLocationId = effectiveLocationId(
    shift?.terminal?.locationId || shift?.terminal?.location?.id
  );
  const saleLocationId = locationIdForApi || terminalLocationId;
  const saleLocationName = locationIdForApi
    ? selectedLocation?.name
    : shift?.terminal?.location?.name || shift?.terminal?.name || 'Terminal location';
  const prevSaleLocationRef = useRef(saleLocationId);

  // Product Panel state
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState('');
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [activeParent, setActiveParent] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customError, setCustomError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerCreditInfo, setCustomerCreditInfo] = useState<any>(null);
  const [loadingCreditInfo, setLoadingCreditInfo] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customerType: 'Individual' as const,
    creditLimit: 0,
    creditTerms: 'Net 30',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [cartDiscountAmount, setCartDiscountAmount] = useState(0);
  const [discountMode, setDiscountMode] = useState<'pct' | 'amount'>('pct');
  const [heldSaleId, setHeldSaleId] = useState<string | null>(null);
  const [managerModal, setManagerModal] = useState<{ open: boolean; title: string; action: null | (() => void) }>({
    open: false,
    title: '',
    action: null,
  });

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([{ paymentMethod:'Cash', amount:0, reference:'' }]);
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [drawerBusy, setDrawerBusy] = useState(false);
  const [drawerMsg, setDrawerMsg] = useState('');
  const [chargingIndex, setChargingIndex] = useState<number | null>(null);
  const [chargeError, setChargeError] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Numpad (for quick quantity / price editing)
  const [editingItem, setEditingItem] = useState<string|null>(null);
  const [numpadValue, setNumpadValue] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const addToCartRef = useRef<(p: Product) => void>(() => {});
  const [scannerEnabled, setScannerEnabled] = useState(() => loadPosSettings().enableBarcodeScanner);
  const [scanValue, setScanValue] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [scanError, setScanError] = useState('');
  const [taxContext, setTaxContext] = useState<TaxContext | null>(null);
  const taxContextRef = useRef<TaxContext | null>(null);
  const pricingModel: TaxPricingModel = taxContext?.pricingModel || 'exclusive';

  useEffect(() => {
    taxService.context()
      .then((r) => {
        taxContextRef.current = r.data;
        setTaxContext(r.data);
        if (!r.data?.enabled) {
          setCart((prev) =>
            prev.map((i) => ({
              ...i,
              taxRate: 0,
              ...computeLineTotal(i.quantity, i.unitPrice, i.discount, 0, 'exclusive'),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Customer search
  const loadCustomers = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setCustomerSuggestions([]);
      return;
    }
    setLoadingCustomers(true);
    try {
      const customers = await customerService.searchCustomers(q, 10);
      setCustomerSuggestions(customers);
    } catch (e) {
      setCustomerSuggestions([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const [companyProfile, setCompanyProfile] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = getAuthToken();
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setCompanyProfile(data.data);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(customerSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery, loadCustomers]);

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerSearchQuery(customer.name);
    setCustomerDropdownOpen(false);
    
    // Fetch customer credit info
    if (customer.id) {
      loadCustomerCreditInfo(customer.id);
    }
  };

  const loadCustomerCreditInfo = async (customerId: string) => {
    setLoadingCreditInfo(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/warehouse/customers/${customerId}/credit-info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCustomerCreditInfo(data.data);
      } else {
        setCustomerCreditInfo(null);
      }
    } catch (e) {
      console.error('Failed to load customer credit info:', e);
      setCustomerCreditInfo(null);
    } finally {
      setLoadingCreditInfo(false);
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearchQuery(value);
    setCustomerName(value);
    if (!value) {
      setSelectedCustomer(null);
      setCustomerPhone('');
      setCustomerCreditInfo(null);
    }
    setCustomerDropdownOpen(true);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || newCustomer.name.trim() === '') {
      alert('Customer name is required');
      return;
    }
    setCreatingCustomer(true);
    try {
      const createdCustomer = await customerService.createCustomer({
        name: newCustomer.name,
        email: newCustomer.email || undefined,
        phone: newCustomer.phone || undefined,
        company: newCustomer.company || undefined,
        customerType: newCustomer.customerType,
        creditLimit: newCustomer.creditLimit,
        creditTerms: newCustomer.creditTerms,
        address: newCustomer.address
      });
      
      // Select the newly created customer
      setSelectedCustomer(createdCustomer);
      setCustomerName(createdCustomer.name);
      setCustomerPhone(createdCustomer.phone || '');
      setCustomerSearchQuery(createdCustomer.name);
      setShowAddCustomerModal(false);
      
      // Reset form
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        company: '',
        customerType: 'Individual',
        creditLimit: 0,
        creditTerms: 'Net 30',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        }
      });
      
      alert('Customer created successfully!');
    } catch (error: any) {
      alert('Failed to create customer: ' + (error.message || 'Unknown error'));
    } finally {
      setCreatingCustomer(false);
    }
  };

  const subtotal     = cart.reduce((s,i)=>s+i.quantity*i.unitPrice,0);
  const pctDiscount  = parseFloat(((subtotal * overallDiscount) / 100).toFixed(2));
  const discountTotal = discountMode === 'amount'
    ? Math.min(cartDiscountAmount, subtotal)
    : pctDiscount;
  const taxTotal     = parseFloat(cart.reduce((s,i)=>s+i.taxAmount,0).toFixed(2));
  const grandTotal   = parseFloat(
    (pricingModel === 'inclusive'
      ? subtotal - discountTotal
      : subtotal - discountTotal + taxTotal
    ).toFixed(2)
  );
  const paidTotal    = payments.reduce((s,p)=>s+p.amount,0);
  const changeDue    = parseFloat((paidTotal - grandTotal).toFixed(2));
  const loyaltyPreview = selectedCustomer && loadPosSettings().loyaltyEnabled
    ? Math.max(0, Math.floor(grandTotal))
    : 0;

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await categoryService.getCategories({
        tree: true,
        locationId: saleLocationId || undefined,
      });
      setCategoryTree(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load categories:', e);
      setCategoryTree([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [saleLocationId]);

  const loadProducts = useCallback(async (q: string, categoryId: string) => {
    setLoadingProducts(true);
    setProductError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('q', q);
      if (categoryId && categoryId !== 'All') params.set('categoryId', categoryId);
      if (saleLocationId) params.set('locationId', saleLocationId);
      const res: any = await posProductService.search(params.toString());
      setProducts(res.data || []);
    } catch (e: any) {
      setProductError(e.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [saleLocationId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const searching = !!query.trim();
    if (!searching && !activeParent) {
      setProducts([]);
      return;
    }
    const delay = query ? 300 : 0;
    const timer = setTimeout(() => {
      loadProducts(query, searching && !activeParent ? 'All' : selectedCategoryId);
    }, delay);
    return () => clearTimeout(timer);
  }, [query, selectedCategoryId, loadProducts, activeParent]);

  useEffect(() => {
    if (prevSaleLocationRef.current && prevSaleLocationRef.current !== saleLocationId) {
      setCart([]);
      if (activeParent || query.trim()) {
        void loadProducts(query, selectedCategoryId);
      }
    }
    prevSaleLocationRef.current = saleLocationId;
  }, [saleLocationId, activeParent, query, selectedCategoryId, loadProducts]);

  const mains = rootCategories(categoryTree);
  const selectedSub = subcategories.find((c) => categoryIdOf(c) === selectedCategoryId) || null;

  const openMainCategory = (cat: Category) => {
    const kids = categoryChildren(cat);
    setActiveParent(cat);
    setSubcategories(kids);
    setSelectedCategoryId(kids.length ? categoryIdOf(kids[0]) : categoryIdOf(cat));
    setQuery('');
  };

  const goToCategories = () => {
    setActiveParent(null);
    setSubcategories([]);
    setSelectedCategoryId('All');
    setQuery('');
    setProducts([]);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const addCustomItem = () => {
    const name = customName.trim();
    const price = parseFloat(customPrice);
    const qty = Math.max(1, Math.round(Number(customQty) || 0));
    if (!name) {
      setCustomError('Enter item name');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setCustomError('Enter a valid price');
      return;
    }
    const model = taxContextRef.current?.pricingModel || 'exclusive';
    const rate = resolveProductTaxRate(undefined, taxContextRef.current);
    const { lineTotal, taxAmount } = computeLineTotal(qty, price, 0, rate, model);
    const lineId = `custom-${Date.now()}`;
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.isCustom && i.productName.toLowerCase() === name.toLowerCase() && Number(i.unitPrice) === price
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === existing.productId
            ? { ...i, quantity: i.quantity + qty, ...computeLineTotal(i.quantity + qty, i.unitPrice, i.discount, i.taxRate, model) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: lineId,
          productName: name,
          sku: 'CUSTOM',
          quantity: qty,
          unitPrice: price,
          discount: 0,
          taxRate: rate,
          taxAmount,
          lineTotal,
          currentStock: 999999,
          availableStock: 999999,
          isCustom: true,
        },
      ];
    });
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
    setCustomError('');
  };

  const addToCart = (p: Product) => {
    const model = taxContextRef.current?.pricingModel || 'exclusive';
    const rate = resolveProductTaxRate(p.taxRate, taxContextRef.current);
    const { lineTotal, taxAmount } = computeLineTotal(1, p.sellingPrice, 0, rate, model);
    setCart(prev => {
      const existing = prev.find(i=>i.productId===p.id);
      if (existing) {
        if (existing.quantity >= sellableQty(p)) return prev;
        return prev.map(i=>i.productId===p.id ? { ...i, quantity:i.quantity+1, ...computeLineTotal(i.quantity+1,i.unitPrice,i.discount,i.taxRate, model) } : i);
      }
      return [...prev, { productId:p.id, productName:p.name, sku:p.sku||'', barcodeNumber:p.barcodeNumber||'', quantity:1, unitPrice:p.sellingPrice, discount:0, taxRate:rate, taxAmount, lineTotal, mainImage:p.mainImage, currentStock: sellableQty(p), availableStock: sellableQty(p) }];
    });
  };
  addToCartRef.current = addToCart;

  const applyScannedCode = useCallback(async (code: string) => {
    const settings = loadPosSettings();
    if (!settings.enableBarcodeScanner) return;
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanValue(trimmed);
    setScanError('');
    setScanStatus('Looking up…');
    try {
      let product: Product | null = null;
      const locId = saleLocationId;
      try {
        const res: any = await posProductService.byBarcode(
          trimmed,
          locId || undefined
        );
        product = res.data || null;
      } catch {
        const params = new URLSearchParams({ q: trimmed, limit: '8' });
        if (locId) params.set('locationId', locId);
        const r: any = await posProductService.search(params.toString());
        product = matchScannedProduct(r.data || [], trimmed);
      }
      if (!product) {
        setScanError(`No product found for ${trimmed}`);
        setScanStatus('');
        setQuery(trimmed);
        return;
      }
      if (sellableQty(product) <= 0) {
        setScanError(`${product.name} is out of stock`);
        setScanStatus('');
        return;
      }
      beepIfEnabled(settings);
      if (settings.autoAddOnScan) {
        addToCartRef.current(product);
        setScanStatus(`Added ${product.name}`);
        setScanValue('');
        setQuery('');
        requestAnimationFrame(() => scanRef.current?.focus());
      } else {
        setQuery(trimmed);
        setScanStatus(`Found ${product.name}`);
      }
    } catch (e: any) {
      setScanError(e.message || 'Scan failed');
      setScanStatus('');
    }
  }, [saleLocationId]);

  const removeFromCart = (productId: string) => setCart(prev=>prev.filter(i=>i.productId!==productId));

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev=>prev.map(i=>{
      if(i.productId!==productId) return i;
      if(!i.isCustom && qty>sellableQty(i)) return i;
      return { ...i, quantity:qty, ...computeLineTotal(qty,i.unitPrice,i.discount,i.taxRate, pricingModel) };
    }));
  };

  const updateDiscount = (productId: string, disc: number) => {
    setCart(prev=>prev.map(i=>i.productId!==productId?i:{ ...i, discount:disc, ...computeLineTotal(i.quantity,i.unitPrice,disc,i.taxRate, pricingModel) }));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOverallDiscount(0);
    setCartDiscountAmount(0);
    setDiscountMode('pct');
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerCreditInfo(null);
    setHeldSaleId(null);
  };

  // Recall held sale into cart
  useEffect(() => {
    const onRecall = (ev: Event) => {
      const sale = (ev as CustomEvent).detail;
      if (!sale?.items?.length) return;
      setCart(
        sale.items.map((item: any) => {
          const { lineTotal, taxAmount } = computeLineTotal(
            item.quantity,
            item.unitPrice,
            item.discount || 0,
            item.taxRate || 0,
            taxContextRef.current?.pricingModel || 'exclusive'
          );
          return {
            productId: item.productId || `custom-${item.productName}-${item.unitPrice}`,
            productName: item.productName,
            sku: item.sku || '',
            isCustom: !item.productId || item.sku === 'CUSTOM' || item.isCustom,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            taxAmount,
            lineTotal,
            currentStock: item.currentStock || item.quantity,
          };
        })
      );
      setCustomerName(sale.customerName || '');
      setCustomerPhone(sale.customerPhone || '');
      setSelectedCustomer(sale.customerId ? { id: sale.customerId, name: sale.customerName } : null);
      setHeldSaleId(sale.id);
      setOverallDiscount(0);
      setCartDiscountAmount(Number(sale.discountTotal || 0));
      if (Number(sale.discountTotal || 0) > 0) setDiscountMode('amount');
    };
    window.addEventListener('pos:recall-held', onRecall as EventListener);
    return () => window.removeEventListener('pos:recall-held', onRecall as EventListener);
  }, []);

  useEffect(() => {
    const syncEnabled = () => setScannerEnabled(loadPosSettings().enableBarcodeScanner);
    syncEnabled();
    const detach = attachHidBarcodeScanner();
    const off = subscribeBarcodeScans((code) => {
      void applyScannedCode(code);
    });
    void reconnectSerialScanner().catch(() => {});
    if (loadPosSettings().enablePaymentTerminal) {
      void reconnectPaymentTerminal().catch(() => {});
    }
    window.addEventListener('pos:settings-changed', syncEnabled);
    return () => {
      detach();
      off();
      window.removeEventListener('pos:settings-changed', syncEnabled);
    };
  }, [applyScannedCode]);

  const requireManagerIfNeeded = (title: string, needsManager: boolean, action: () => void) => {
    if (!needsManager) {
      action();
      return;
    }
    setManagerModal({ open: true, title, action });
  };

  const handleNumpadKey = (key:string) => {
    setNumpadValue(prev => {
      if (key==='⌫') return prev.slice(0,-1);
      if (key==='00') return prev==='0' ? '0' : prev+'00';
      if (prev==='0' && key!=='.') return key;
      return prev+key;
    });
  };

  useEffect(() => {
    if (editingItem && numpadValue) {
      const qty = parseInt(numpadValue);
      if (!isNaN(qty) && qty >= 0) updateQty(editingItem, qty);
    }
  }, [numpadValue, editingItem]);

  const addPayment = () => setPayments(p=>[...p,{ paymentMethod:'Cash', amount:0, reference:'' }]);
  const removePayment = (i:number) => setPayments(p=>p.filter((_,idx)=>idx!==i));
  const updatePayment = (i:number, field:string, value:any) => setPayments(p=>p.map((pm,idx)=>{
    if (idx !== i) return pm;
    if (field === 'paymentMethod') {
      return { ...pm, paymentMethod: value, terminalApproved: false, reference: '', cardLast4: '', entryMode: '' };
    }
    if (field === 'amount' && pm.terminalApproved) return pm;
    return { ...pm, [field]: value };
  }));
  const handleOpenDrawer = async () => {
    setDrawerBusy(true);
    setDrawerMsg('');
    try {
      await kickCashDrawer();
      setDrawerMsg('Drawer open signal sent');
    } catch (e: any) {
      setDrawerMsg(e?.message || 'Could not open drawer');
    } finally {
      setDrawerBusy(false);
    }
  };

  const setExactAmount = () => setPayments([{
    paymentMethod: payments[0].paymentMethod,
    amount: grandTotal,
    reference: payments[0].terminalApproved ? payments[0].reference : '',
    terminalApproved: payments[0].terminalApproved,
    cardLast4: payments[0].cardLast4,
    entryMode: payments[0].entryMode,
  }]);

  const chargeOnTerminal = async (index: number) => {
    const pmt = payments[index];
    const amount = pmt.amount > 0 ? pmt.amount : parseFloat((grandTotal - (paidTotal - pmt.amount)).toFixed(2));
    if (amount <= 0) {
      setSaleError('Enter an amount to charge on the payment device');
      return;
    }
    setChargeError('');
    setSaleError('');
    setChargingIndex(index);
    try {
      const result = await requestPaymentTerminalSale({ amount, invoice: `POS-${Date.now()}` });
      if (!result.approved) {
        setChargeError(result.message || 'Declined on payment device');
        return;
      }
      setPayments((prev) => prev.map((pm, idx) => idx === index ? {
        ...pm,
        amount,
        reference: result.reference,
        terminalApproved: true,
        cardLast4: result.cardLast4,
        entryMode: result.entryMode,
      } : pm));
    } catch (e: any) {
      setChargeError(e.message || 'Payment device failed');
    } finally {
      setChargingIndex(null);
    }
  };

  // Complete Sale
  const completeSale = async () => {
    if (cart.length===0) { setSaleError('Cart is empty'); return; }
    const oversold = cart.find((i) => !i.isCustom && i.quantity > sellableQty(i));
    if (oversold) {
      setSaleError(`${oversold.productName} only has ${sellableQty(oversold)} available`);
      return;
    }
    if (paidTotal < grandTotal) { setSaleError(`Insufficient payment. Need ${money(grandTotal)}, got ${money(paidTotal)}`); return; }
    const uncharged = payments.find((p) => methodNeedsPaymentDevice(p.paymentMethod) && !p.terminalApproved && p.amount > 0);
    if (uncharged) {
      setSaleError(`Charge ${uncharged.paymentMethod} on the ${loadPosSettings().paymentTerminalModel} before completing the sale`);
      return;
    }

    if (selectedCustomer && customerCreditInfo && customerCreditInfo.creditLimit > 0) {
      const newOutstanding = customerCreditInfo.outstandingBalance + grandTotal;
      if (newOutstanding > customerCreditInfo.creditLimit) {
        const overAmount = newOutstanding - customerCreditInfo.creditLimit;
        setSaleError(`Credit limit exceeded. Available: ${money(customerCreditInfo.availableCredit)}, Over by: ${money(overAmount)}`);
        return;
      }
    }

    const settings = loadPosSettings();
    const maxLineDisc = Math.max(...cart.map((i) => i.discount || 0), overallDiscount, 0);
    const needsMgr =
      settings.requireManagerForDiscount &&
      (maxLineDisc > settings.discountThresholdPct ||
        (discountMode === 'amount' && subtotal > 0 && (discountTotal / subtotal) * 100 > settings.discountThresholdPct));

    const doSubmit = async () => {
      if (submitting) return;
      setSubmitting(true);
      setSaleError('');
      const payload = {
        id: heldSaleId || undefined,
        terminalId: shift.terminalId,
        locationId: saleLocationId || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone || null,
        customerEmail: selectedCustomer?.email || null,
        customerId: selectedCustomer?.id || null,
        items: cart.map((i) => ({
          productId: i.isCustom ? null : i.productId,
          productName: i.productName,
          sku: i.isCustom ? 'CUSTOM' : i.sku,
          quantity: Math.max(1, Math.round(Number(i.quantity) || 0)),
          unitPrice: i.unitPrice,
          discount: i.discount,
          taxRate: i.taxRate,
          pricingModel,
          taxType: pricingModel === 'inclusive' ? 'Inclusive' : 'Exclusive',
          isCustom: Boolean(i.isCustom),
        })),
        payments: payments.map((p) => ({
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          reference: p.reference || '',
        })),
        discountTotal,
        taxTotal,
        notes: '',
      };

      try {
        const res: any = await posSaleService.complete(payload);
        const completedSale = {
          ...res.data?.sale,
          items: res.data?.sale?.items?.length ? res.data.sale.items : cart,
          payments: res.data?.sale?.payments?.length ? res.data.sale.payments : payload.payments,
          paidAmount: paidTotal,
          changeAmount: changeDue,
          cashierName: `${shift.cashier?.firstName || ''} ${shift.cashier?.lastName || ''}`.trim(),
          terminalName: shift.terminal?.name,
          terminalCode: shift.terminal?.code,
        };
        setLastSale(completedSale);
        setShowReceipt(true);
        setShowCheckout(false);
        if (heldSaleId) {
          try { await posSaleService.deleteHeld(heldSaleId); } catch { /* ignore */ }
        }
        clearCart();
        loadProducts(query, selectedCategoryId);
      } catch (e: any) {
        setSaleError(e.message || 'Sale failed');
      } finally {
        setSubmitting(false);
      }
    };

    requireManagerIfNeeded('Manager approval for discount', needsMgr, () => {
      setManagerModal({ open: false, title: '', action: null });
      void doSubmit();
    });
  };

  const holdSale = async () => {
    if (cart.length===0) return;
    try {
      await posSaleService.hold({
        terminalId: shift.terminalId,
        customerId: selectedCustomer?.id || null,
        customerName: customerName||'Walk-in Customer',
        customerPhone: customerPhone || null,
        customerEmail: selectedCustomer?.email || null,
        items: cart.map(i=>({ productId:i.productId, productName:i.productName, sku:i.sku, quantity:i.quantity, unitPrice:i.unitPrice, discount:i.discount, taxRate:i.taxRate })),
        discountTotal,
        taxTotal,
      });
      clearCart();
      alert('Sale held successfully');
    } catch (e:any) {
      alert('Failed to hold sale: '+e.message);
    }
  };

  const handleDownloadReport = async () => {
    if (!lastSale) return;
    await downloadPosReceiptPdf({
      sale: lastSale,
      company: resolveReceiptCompany(companyProfile),
      shift,
      settings: loadPosSettings(),
    });
  };

  // Send receipt via email
  const handleSendEmail = async (email: string) => {
    try {
      const token = document.cookie.split('auth_token=')[1]?.split(';')[0];
      const response = await fetch('/api/pos/send-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          sale: lastSale,
          companyProfile,
          receiptMeta: {
            barcodeDataUrl: barcodePngDataUrl(receiptBarcodeValue(lastSale)),
            qrDataUrl: await receiptQrPngDataUrl(lastSale, shift),
            currencySymbol: loadCurrencyLocal().symbol || '$',
            footer: loadReceiptTemplate().receiptFooter,
            header: loadReceiptTemplate().receiptHeader,
            returnPolicy: loadReceiptTemplate().receiptReturnPolicy,
            notes: loadReceiptTemplate().receiptNotes,
            cashierName: `${shift.cashier?.firstName || ''} ${shift.cashier?.lastName || ''}`.trim(),
            terminalName: shift.terminal?.name,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (e) {
      throw e;
    }
  };

  return (
    <div className="flex h-full overflow-hidden font-sans flex-col lg:flex-row">
      {/* ─── LEFT: Product Browser ──────────────────────────────── */}
      <div className="w-full lg:w-[55%] flex flex-col border-r border-gray-200 overflow-hidden bg-gray-50 min-h-0 flex-1">
        <div className="p-3 bg-white border-b border-gray-200 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-sm text-gray-700">
            <span>
              Selling from{' '}
              <strong className="text-[#014582]">{saleLocationName || 'selected location'}</strong>
              {isAllLocations && terminalLocationId ? ' (header is All — using terminal location)' : ''}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchRef}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 text-base outline-none focus:border-[#014582] transition-colors"
                placeholder="Search by name or SKU..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
            </div>
            {scannerEnabled && (
              <div className="relative w-full sm:w-[44%] min-w-0 sm:min-w-[160px]">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-[#014582] w-4 h-4" />
                <input
                  ref={scanRef}
                  data-pos-scan="1"
                  className="w-full bg-[#014582]/5 border border-[#014582]/30 rounded-xl pl-9 pr-3 py-3 text-gray-900 text-base outline-none focus:border-[#014582] transition-colors"
                  placeholder="Scan barcode..."
                  value={scanValue}
                  onChange={(e) => {
                    setScanValue(e.target.value);
                    setScanError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scanValue.trim()) {
                      e.preventDefault();
                      void applyScannedCode(scanValue.trim());
                    }
                  }}
                />
              </div>
            )}
          </div>
          {scannerEnabled && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Scanner ready — scan a product barcode
              </span>
              {scanStatus ? <span className="text-emerald-600 truncate">{scanStatus}</span> : null}
              {scanError ? <span className="text-red-600 truncate">{scanError}</span> : null}
            </div>
          )}

          {activeParent ? (
            <>
              <nav className="flex items-center flex-wrap gap-1 text-sm font-semibold text-gray-600">
                <button type="button" onClick={goToCategories} className="text-[#014582] hover:underline">
                  Categories
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{activeParent.name}</span>
                {selectedSub ? (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{selectedSub.name}</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">Products</span>
                  </>
                )}
              </nav>
              {subcategories.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {subcategories.map((cat) => {
                    const id = categoryIdOf(cat);
                    const on = selectedCategoryId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleCategorySelect(id)}
                        className={`aspect-square rounded-xl border flex items-center justify-center text-center px-1.5 text-xs sm:text-sm font-bold leading-tight ${
                          on
                            ? 'bg-[#014582] border-[#014582] text-white'
                            : 'bg-white border-gray-300 text-gray-800 hover:border-[#014582]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-700">Categories</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
          {!query.trim() && !activeParent ? (
            loadingCategories ? (
              <div className="text-center text-gray-600 py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#014582]" />
                Loading categories...
              </div>
            ) : mains.length === 0 ? (
              <div className="text-center text-gray-600 py-12">No categories</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
                {mains.map((cat) => {
                  const id = categoryIdOf(cat);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openMainCategory(cat)}
                      className="aspect-square rounded-2xl border-2 border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center gap-2 px-3 text-center hover:border-[#014582] hover:bg-sky-50 transition-colors"
                    >
                      <LayoutGrid className="w-8 h-8 text-[#014582]" />
                      <span className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : loadingProducts ? (
            <div className="text-center text-gray-600 text-base py-12">Loading products...</div>
          ) : productError ? (
            <div className="text-center text-red-600 py-6">{productError}</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-600 text-base py-12">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
              <button
                type="button"
                onClick={goToCategories}
                className="mt-3 text-[#014582] text-sm underline"
              >
                Back to categories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {products.map(p=>(
            <div
              key={p.id}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-1.5 hover:bg-sky-50 hover:border-[#014582]/30"
              onClick={()=>addToCart(p)}
            >
              <div className="w-full h-24 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                {p.mainImage ? (
                  <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover rounded-lg" onError={e=>{ (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <Package className="w-8 h-7 text-gray-500" />
                )}
              </div>
              <div className="text-gray-900 font-bold text-sm leading-tight">{p.name}</div>
              {p.sku && <div className="text-gray-600 text-xs">{p.sku}</div>}
              {p.categoryName && (
                <div className="text-gray-600 text-xs truncate">{p.categoryName}</div>
              )}
              <div className="text-[#014582] font-bold text-lg">{money(p.sellingPrice)}</div>
              <div className={`text-xs font-semibold ${p.currentStock <= 0 ? 'text-red-600' : p.currentStock <= 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                Stock: {p.currentStock}
              </div>
            </div>
          ))}
            </div>
          )}
        </div>
      </div>

      <div className={`flex-col overflow-hidden bg-white border-l border-gray-200 lg:relative lg:flex lg:w-[45%] ${mobileCartOpen ? 'fixed inset-0 z-[80] flex' : 'hidden lg:flex'}`}>
        {/* Cart header */}
        <div className="p-3 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-900 font-bold text-base flex items-center gap-2 m-0">
              <ShoppingCart className="w-5 h-5 text-[#014582]" />
              Cart <span className="text-gray-600 font-medium text-sm">({cart.length} items)</span>
            </h3>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button onClick={clearCart} className="bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1 text-red-600 cursor-pointer text-xs">Clear</button>
              )}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-700"
                onClick={() => setMobileCartOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Customer Selection — optional */}
          <div className="mt-3 relative">
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Customer <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                ref={customerSearchRef}
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                placeholder="Search customer or type name..."
                value={customerSearchQuery}
                onChange={handleCustomerInputChange}
                onFocus={() => setCustomerDropdownOpen(true)}
                onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 200)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            {/* Customer Dropdown */}
            {customerDropdownOpen && (customerSuggestions.length > 0 || loadingCustomers || customerSearchQuery.length >= 2) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[200px] overflow-y-auto">
                {loadingCustomers ? (
                  <div className="p-3 text-center text-gray-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    Loading...
                  </div>
                ) : customerSuggestions.length === 0 ? (
                  <div className="p-3">
                    <div className="text-center text-gray-400 text-xs mb-2">No customers found</div>
                    <button
                      onClick={() => setShowAddCustomerModal(true)}
                      className="w-full bg-[#014582]/10 border border-[#014582]/30 rounded-lg px-3 py-2 text-[#014582] text-xs font-semibold hover:bg-[#014582]/15 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Add New Customer
                    </button>
                  </div>
                ) : (
                  customerSuggestions.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="text-gray-900 text-sm font-medium">{customer.name}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{customer.phone || customer.email || 'No contact info'}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Customer Credit Info */}
          {selectedCustomer && customerCreditInfo && (
            <div className="mt-2.5 bg-white border border-gray-200 rounded-lg p-2.5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-600">Credit Limit:</span>
                <span className="text-gray-900 font-medium">{money(customerCreditInfo.creditLimit)}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-600">Outstanding:</span>
                <span className="text-gray-900 font-medium">{money(customerCreditInfo.outstandingBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-600">Available:</span>
                <span className={`${customerCreditInfo.availableCredit >= 0 ? 'text-emerald-600' : 'text-red-600'} font-medium`}>
                  {money(customerCreditInfo.availableCredit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Utilization:</span>
                <span className={`${customerCreditInfo.utilization > 80 ? 'text-red-600' : customerCreditInfo.utilization > 50 ? 'text-amber-600' : 'text-emerald-600'} font-medium`}>
                  {customerCreditInfo.utilization.toFixed(1)}%
                </span>
              </div>
              {(customerCreditInfo.loyaltyPoints != null || selectedCustomer?.loyaltyPoints != null) && (
                <div className="flex justify-between items-center text-xs mt-1.5">
                  <span className="text-gray-600">Loyalty points:</span>
                  <span className="text-sky-700 font-medium">
                    {customerCreditInfo.loyaltyPoints ?? selectedCustomer?.loyaltyPoints ?? 0}
                  </span>
                </div>
              )}
              {customerCreditInfo.utilization > 80 && (
                <div className="mt-2 text-[10px] text-amber-600 bg-yellow-400/10 rounded px-2 py-1">
                  ⚠️ Credit limit nearly exceeded
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2.5 mt-2.5">
            <input
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={e=>setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="px-3 pt-2 pb-1 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Add without product</p>
          <div className="flex flex-col gap-1.5">
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 text-xs outline-none focus:border-[#014582]"
              placeholder="Item name"
              value={customName}
              onChange={(e) => { setCustomName(e.target.value); setCustomError(''); }}
            />
            <div className="flex gap-1.5">
              <input
                type="number"
                min="0"
                step="0.01"
                className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 text-xs outline-none focus:border-[#014582]"
                placeholder="Price"
                value={customPrice}
                onChange={(e) => { setCustomPrice(e.target.value); setCustomError(''); }}
              />
              <input
                type="number"
                min="1"
                className="w-16 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 text-xs outline-none focus:border-[#014582]"
                placeholder="Qty"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
              />
              <button
                type="button"
                onClick={addCustomItem}
                className="px-3 rounded-lg bg-[#014582] text-white text-xs font-semibold hover:bg-[#01366a]"
              >
                Add
              </button>
            </div>
            {customError ? <p className="text-[10px] text-red-600">{customError}</p> : null}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-base">Tap a product, or add a custom item above</p>
            </div>
          ) : (
            cart.map(item=>(
              <div key={item.productId} className="bg-white border border-gray-200 rounded-xl p-2.5 mb-2 flex gap-2.5 items-start">
                <div className="flex-1">
                  <div className="text-gray-900 font-bold text-sm mb-1">
                    {item.productName}
                    {item.isCustom ? <span className="ml-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">Custom</span> : null}
                  </div>
                  <div className="text-gray-700 text-sm">{money(item.unitPrice)} each</div>
                  {/* discount input */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-gray-600 text-xs">Disc%:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={e=>updateDiscount(item.productId,parseFloat(e.target.value)||0)}
                      className="w-14 bg-white border border-gray-200 rounded-md px-1.5 py-1 text-gray-900 text-xs outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={()=>removeFromCart(item.productId)} className="bg-transparent border-none text-red-600 cursor-pointer text-sm">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-[#014582] font-bold text-base">{money(item.lineTotal)}</div>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-lg border border-gray-300 bg-transparent text-gray-900 cursor-pointer text-sm flex items-center justify-center" onClick={()=>updateQty(item.productId,item.quantity-1)}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-gray-900 font-semibold w-8 text-center text-sm">{item.quantity}</span>
                    <button className="w-7 h-7 rounded-lg border border-gray-300 bg-transparent text-gray-900 cursor-pointer text-sm flex items-center justify-center" onClick={()=>updateQty(item.productId,item.quantity+1)}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex justify-between text-gray-700 text-sm">
              <span>Subtotal</span><span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700 text-sm items-center gap-2">
              <span className="flex items-center gap-1">
                Disc
                <select
                  value={discountMode}
                  onChange={(e) => setDiscountMode(e.target.value as 'pct' | 'amount')}
                  className="bg-transparent border border-gray-300 rounded px-1 text-[10px] text-amber-600"
                >
                  <option value="pct">%</option>
                  <option value="amount">$</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountMode === 'pct' ? overallDiscount : cartDiscountAmount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    if (discountMode === 'pct') setOverallDiscount(v);
                    else setCartDiscountAmount(v);
                  }}
                  className="w-12 bg-transparent border-none border-b border-gray-300 text-amber-600 outline-none text-xs text-center"
                />
              </span>
              <span className="text-amber-600">-{money(discountTotal)}</span>
            </div>
            {loyaltyPreview > 0 && (
              <div className="flex justify-between text-sky-700 text-xs">
                <span>Loyalty earn</span><span>+{loyaltyPreview} pts</span>
              </div>
            )}
            {heldSaleId && (
              <div className="text-[10px] text-amber-700">Resuming held sale</div>
            )}
            {taxTotal > 0 && (
              <div className="flex justify-between text-gray-700 text-sm">
                <span>{taxContext?.regime || 'Tax'}{pricingModel === 'inclusive' ? ' (incl.)' : ''}</span><span>{money(taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 text-xl font-bold border-t border-gray-200 pt-2 mt-1">
              <span>Total</span><span className="text-[#014582]">{money(grandTotal)}</span>
            </div>
          </div>

          <button
            className={`w-full py-4 rounded-xl bg-gradient-to-r from-[#014582] to-[#01366a] text-white font-bold text-base cursor-pointer mt-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${cart.length===0?'opacity-50':''}`}
            disabled={cart.length===0}
            onClick={()=>{ setPayments([{ paymentMethod:'Cash', amount:grandTotal, reference:'' }]); setSaleError(''); setShowCheckout(true); }}
          >
            <CreditCard className="w-4 h-4" />
            Checkout — {money(grandTotal)}
          </button>
          <button
            className="w-full py-3 rounded-xl border border-[#014582]/30 bg-[#014582]/5 text-[#014582] text-sm font-semibold cursor-pointer mt-2 hover:bg-[#014582]/10 transition-colors"
            onClick={holdSale}
            disabled={cart.length===0}
          >
            ⏸️ Hold Sale
          </button>
          <button
            type="button"
            className="w-full py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold cursor-pointer mt-2 hover:bg-amber-100 transition-colors disabled:opacity-50"
            onClick={() => { void handleOpenDrawer(); }}
            disabled={drawerBusy}
          >
            {drawerBusy ? 'Opening drawer…' : 'Open cash drawer'}
          </button>
          {drawerMsg ? <p className="text-[11px] text-gray-500 mt-1 text-center">{drawerMsg}</p> : null}
        </div>
      </div>

      <div className="lg:hidden fixed left-0 right-0 bottom-16 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div>
          <p className="text-xs text-gray-600">{cart.length} items</p>
          <p className="text-lg font-bold text-[#014582]">{money(grandTotal)}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#014582] text-white font-bold text-sm"
        >
          View cart
        </button>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150]">
          <div className="relative bg-white border border-gray-200 shadow-lg rounded-2xl p-7 w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-900 text-xl font-semibold m-0 mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Checkout
            </h2>

            {(saleError || chargeError) && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-red-600 text-xs mb-4">
                {saleError || chargeError}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-4 max-h-[150px] overflow-y-auto">
              {cart.map(item=>(
                <div key={item.productId} className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-600">{item.productName} × {item.quantity}</span>
                  <span className="text-gray-900 font-semibold">{money(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 mb-4">
              {overallDiscount > 0 && (
                <div className="flex justify-between text-amber-600 text-xs mb-1">
                  <span>Discount ({overallDiscount}%)</span><span>-{money(discountTotal)}</span>
                </div>
              )}
              {taxTotal > 0 && (
                <div className="flex justify-between text-gray-400 text-xs mb-1">
                  <span>{taxContext?.regime || 'Tax'}{pricingModel === 'inclusive' ? ' (incl.)' : ''}</span><span>{money(taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 text-xl font-bold">
                <span>Total</span><span className="text-[#014582]">{money(grandTotal)}</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-gray-400 text-xs">Payment</label>
                <button
                  onClick={addPayment}
                  className="bg-transparent border border-[#014582]/40 text-[#014582] rounded-lg px-2.5 py-1 cursor-pointer text-xs"
                >
                  + Split
                </button>
              </div>
              {payments.map((pmt,i)=>(
                <div key={i} className="mb-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={pmt.paymentMethod}
                      onChange={e=>updatePayment(i,'paymentMethod',e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs outline-none"
                    >
                      {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      type="number"
                      value={pmt.amount}
                      onChange={e=>updatePayment(i,'amount',parseFloat(e.target.value)||0)}
                      min="0"
                      step="0.01"
                      disabled={!!pmt.terminalApproved}
                      className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2 text-gray-900 text-xs outline-none disabled:opacity-60"
                      placeholder="Amount"
                    />
                    {payments.length > 1 && (
                      <button onClick={()=>removePayment(i)} className="bg-transparent border-none text-red-600 cursor-pointer text-sm">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {methodNeedsPaymentDevice(pmt.paymentMethod) && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      {pmt.terminalApproved ? (
                        <span className="text-emerald-600 text-[11px] font-semibold">
                          Approved{pmt.cardLast4 ? ` · ****${pmt.cardLast4}` : ''}{pmt.entryMode ? ` · ${pmt.entryMode}` : ''}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void chargeOnTerminal(i)}
                          className="flex-1 py-2 rounded-lg bg-[#014582] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Nfc className="w-3.5 h-3.5" />
                          Charge {loadPosSettings().paymentTerminalModel}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={setExactAmount}
                className="w-full py-2 rounded-lg border border-dashed border-[#014582]/40 bg-transparent text-[#014582] cursor-pointer text-xs mt-1 hover:bg-[#014582]/5 transition-colors"
              >
                💡 Set exact amount: {money(grandTotal)}
              </button>
            </div>

            {/* Change */}
            {changeDue !== 0 && (
              <div className={`p-2.5 rounded-lg border mb-3.5 flex justify-between ${
                changeDue>=0
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <span className={`${changeDue>=0?'text-emerald-600':'text-red-600'} font-semibold text-sm`}>
                  {changeDue>=0?'Change Due':'Still Owed'}
                </span>
                <span className={`${changeDue>=0?'text-emerald-600':'text-red-600'} font-bold text-lg`}>
                  {money(Math.abs(changeDue))}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => { void handleOpenDrawer(); }}
              disabled={drawerBusy}
              className="w-full py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold mb-3 disabled:opacity-50"
            >
              {drawerBusy ? 'Opening drawer…' : 'Open cash drawer'}
            </button>
            {drawerMsg ? <p className="text-[11px] text-gray-500 -mt-2 mb-3 text-center">{drawerMsg}</p> : null}

            <div className="flex gap-3">
              <button
                onClick={()=>setShowCheckout(false)}
                className="flex-1 py-3 rounded-lg bg-transparent border border-gray-200 text-gray-400 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={completeSale}
                disabled={submitting||changeDue<0||payments.some((p)=>methodNeedsPaymentDevice(p.paymentMethod)&&!p.terminalApproved&&p.amount>0)}
                className={`flex-[2] py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 border-none text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${changeDue<0?'opacity-50':''}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>

          {chargingIndex !== null && (
            <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full border-2 border-[#014582] flex items-center justify-center animate-pulse">
                  <Nfc className="w-8 h-8 text-sky-700" />
                </div>
                <p className="text-gray-900 text-lg font-semibold m-0">Present card on {loadPosSettings().paymentTerminalModel}</p>
                <p className="text-[#014582] text-2xl font-bold mt-2 mb-1">
                  {money(payments[chargingIndex]?.amount || grandTotal)}
                </p>
                <p className="text-gray-400 text-xs mb-5">Chip, tap or swipe — waiting for the payment device</p>
                {chargeError ? <p className="text-red-600 text-xs mb-3">{chargeError}</p> : null}
                <button
                  type="button"
                  onClick={() => { void cancelPaymentTerminalSale(); setChargingIndex(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs"
                >
                  Cancel on terminal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showReceipt && lastSale && (
        <ReceiptModal 
          sale={lastSale} 
          companyProfile={companyProfile}
          shift={shift}
          onClose={()=>setShowReceipt(false)} 
          onDownloadReport={handleDownloadReport}
          onSendEmail={handleSendEmail}
        />
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-[#014582]" />
                  Add New Customer
                </h3>
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Customer Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                    placeholder="customer@email.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                    placeholder="Company name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Customer Type</label>
                  <select
                    value={newCustomer.customerType}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, customerType: e.target.value as any }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Manufacturer">Manufacturer</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5">Credit Limit</label>
                    <input
                      type="number"
                      value={newCustomer.creditLimit}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5">Credit Terms</label>
                    <select
                      value={newCustomer.creditTerms}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, creditTerms: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-gray-400 text-xs mb-2">Address</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCustomer.address.city}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={newCustomer.address.state}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={newCustomer.address.postalCode}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, postalCode: e.target.value } }))}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                      placeholder="Postal Code"
                    />
                    <input
                      type="text"
                      value={newCustomer.address.country}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs outline-none focus:border-[#014582] transition-colors"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-transparent border border-gray-200 text-gray-400 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer}
                  className="flex-[2] py-2.5 rounded-lg bg-gradient-to-r from-[#014582] to-[#01366a] border-none text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creatingCustomer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ManagerPinModal
        open={managerModal.open}
        title={managerModal.title}
        onCancel={() => setManagerModal({ open: false, title: '', action: null })}
        onVerified={() => {
          const action = managerModal.action;
          setManagerModal({ open: false, title: '', action: null });
          action?.();
        }}
      />
    </div>
  );
}
