'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { posProductService, posSaleService } from '../../../lib/pos-service';
import { customerService } from '../../../app/api/customer/route';
import { categoryService, Category } from '../../../app/api/category/route';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, DollarSign, Printer, Check, Loader2, Package, User, ChevronDown, Download, Barcode, Nfc } from 'lucide-react';
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
import { newOfflineSaleId, posOfflineQueue } from '../../../lib/pos-offline-queue';
import POSReceipt from './POSReceipt';
import {
  barcodePngDataUrl,
  downloadPosReceiptPdf,
  printReceiptNode,
  receiptBarcodeValue,
  resolveReceiptCompany,
} from '../../../lib/pos-receipt';
import {
  computeTaxLine,
  resolveProductTaxRate,
  taxService,
  type TaxContext,
  type TaxPricingModel,
} from '../../../lib/tax-service';

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
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-[400px] max-w-[95vw]">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-xs mb-4">Enter manager email and password to approve.</p>
        {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
        <input
          className="w-full mb-2 bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="Manager email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full mb-4 bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-white/15 text-gray-300 text-sm">
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
            className="flex-1 py-2 rounded-lg bg-[#f59e0b] text-black text-sm font-bold"
          >
            {loading ? 'Checking...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CartItem { productId:string; productName:string; sku:string; barcodeNumber?:string; quantity:number; unitPrice:number; discount:number; taxRate:number; taxAmount:number; lineTotal:number; mainImage?:string; currentStock:number; }
interface Payment {
  paymentMethod: string;
  amount: number;
  reference: string;
  terminalApproved?: boolean;
  cardLast4?: string;
  entryMode?: string;
}
interface Product { id:string; name:string; sku:string; barcodeNumber:string; sellingPrice:number; costPrice:number; currentStock:number; mainImage?:string; categoryId?:string; categoryName?:string; taxRate?:number; }

function flattenCategories(categories: Category[]): { id: string; name: string; productCount?: number }[] {
  const result: { id: string; name: string; productCount?: number }[] = [];
  const walk = (items: Category[], prefix = '') => {
    for (const cat of items) {
      const id = cat.id || cat._id;
      if (!id) continue;
      const label = prefix ? `${prefix} › ${cat.name}` : cat.name;
      result.push({ id, name: label, productCount: cat.productCount });
      const children = cat.children || cat.subCategories || [];
      if (children.length) walk(children, cat.name);
    }
  };
  walk(categories);
  return result;
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
              ? 'bg-red-500/15 border border-red-500/30 text-red-400'
              : 'bg-white/6 border border-white/10 text-white hover:bg-white/10'
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
  const paperRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    if (paperRef.current) printReceiptNode(paperRef.current, loadReceiptTemplate().thermalPaperWidthMm);
  };

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
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-lg border-none bg-[#014582] text-white cursor-pointer font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#01366a]"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={onDownloadReport} className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer font-semibold text-sm flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
        
        <div className="flex gap-3 mt-3 no-print">
          <button onClick={()=>setShowEmailForm(!showEmailForm)} className="flex-1 py-2.5 rounded-lg border border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] cursor-pointer font-semibold text-sm flex items-center justify-center gap-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#f59e0b]"
              />
            </div>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full py-2 rounded-lg bg-[#f59e0b] text-white font-semibold text-sm cursor-pointer hover:bg-[#d97706] disabled:opacity-50 flex items-center justify-center gap-2"
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
  // Product Panel state
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string; productCount?: number }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
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
      const data = await categoryService.getCategories({ tree: true });
      setCategories(flattenCategories(data));
    } catch (e) {
      console.error('Failed to load categories:', e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadProducts = useCallback(async (q: string, categoryId: string) => {
    setLoadingProducts(true);
    setProductError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('q', q);
      if (categoryId && categoryId !== 'All') params.set('categoryId', categoryId);
      const res: any = await posProductService.search(params.toString());
      setProducts(res.data || []);
    } catch (e: any) {
      setProductError(e.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const delay = query ? 300 : 0;
    const timer = setTimeout(() => {
      loadProducts(query, selectedCategoryId);
    }, delay);
    return () => clearTimeout(timer);
  }, [query, selectedCategoryId, loadProducts]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const addToCart = (p: Product) => {
    const model = taxContextRef.current?.pricingModel || 'exclusive';
    const rate = resolveProductTaxRate(p.taxRate, taxContextRef.current);
    const { lineTotal, taxAmount } = computeLineTotal(1, p.sellingPrice, 0, rate, model);
    setCart(prev => {
      const existing = prev.find(i=>i.productId===p.id);
      if (existing) {
        if (existing.quantity >= p.currentStock) return prev;
        return prev.map(i=>i.productId===p.id ? { ...i, quantity:i.quantity+1, ...computeLineTotal(i.quantity+1,i.unitPrice,i.discount,i.taxRate, model) } : i);
      }
      return [...prev, { productId:p.id, productName:p.name, sku:p.sku||'', barcodeNumber:p.barcodeNumber||'', quantity:1, unitPrice:p.sellingPrice, discount:0, taxRate:rate, taxAmount, lineTotal, mainImage:p.mainImage, currentStock:p.currentStock }];
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
      try {
        const res: any = await posProductService.byBarcode(trimmed);
        product = res.data || null;
      } catch {
        const r: any = await posProductService.search(
          new URLSearchParams({ q: trimmed, limit: '8' }).toString()
        );
        product = matchScannedProduct(r.data || [], trimmed);
      }
      if (!product) {
        setScanError(`No product found for ${trimmed}`);
        setScanStatus('');
        setQuery(trimmed);
        return;
      }
      if ((product.currentStock || 0) <= 0) {
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
  }, []);

  const removeFromCart = (productId: string) => setCart(prev=>prev.filter(i=>i.productId!==productId));

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev=>prev.map(i=>{
      if(i.productId!==productId) return i;
      if(qty>i.currentStock) return i;
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
            productId: item.productId,
            productName: item.productName,
            sku: item.sku || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            taxAmount,
            lineTotal,
            currentStock: item.quantity + 999,
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
    if (!customerName || customerName.trim() === '') { setSaleError('Customer is required'); return; }
    if (paidTotal < grandTotal) { setSaleError(`Insufficient payment. Need $${grandTotal.toFixed(2)}, got $${paidTotal.toFixed(2)}`); return; }
    const uncharged = payments.find((p) => methodNeedsPaymentDevice(p.paymentMethod) && !p.terminalApproved && p.amount > 0);
    if (uncharged) {
      setSaleError(`Charge ${uncharged.paymentMethod} on the ${loadPosSettings().paymentTerminalModel} before completing the sale`);
      return;
    }

    if (selectedCustomer && customerCreditInfo && customerCreditInfo.creditLimit > 0) {
      const newOutstanding = customerCreditInfo.outstandingBalance + grandTotal;
      if (newOutstanding > customerCreditInfo.creditLimit) {
        const overAmount = newOutstanding - customerCreditInfo.creditLimit;
        setSaleError(`Credit limit exceeded. Available: $${customerCreditInfo.availableCredit.toFixed(2)}, Over by: $${overAmount.toFixed(2)}`);
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
      setSubmitting(true);
      setSaleError('');
      const saleId = heldSaleId || newOfflineSaleId();
      const payload = {
        id: saleId,
        terminalId: shift.terminalId,
        customerName,
        customerPhone: customerPhone || null,
        customerEmail: selectedCustomer?.email || null,
        customerId: selectedCustomer?.id || null,
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          taxRate: i.taxRate,
          pricingModel,
          taxType: pricingModel === 'inclusive' ? 'Inclusive' : 'Exclusive',
        })),
        payments: payments.map((p) => ({
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          reference: p.reference || '',
        })),
        discountTotal,
        taxTotal,
        notes: '',
        isOffline: !navigator.onLine,
        offlineCreatedAt: new Date().toISOString(),
      };

      try {
        if (!navigator.onLine && settings.enableOfflineMode) {
          posOfflineQueue.enqueue({ ...payload, isOffline: true as const });
          window.dispatchEvent(new Event('pos:offline-queue-changed'));
          setLastSale({
            ...payload,
            invoiceNumber: `OFFLINE-${Date.now()}`,
            subtotal,
            grandTotal,
            items: cart,
            payments: payload.payments,
            paidAmount: paidTotal,
            changeAmount: changeDue,
            createdAt: new Date().toISOString(),
            cashierName: `${shift.cashier?.firstName || ''} ${shift.cashier?.lastName || ''}`.trim(),
            terminalName: shift.terminal?.name,
            terminalCode: shift.terminal?.code,
          });
          setShowReceipt(true);
          setShowCheckout(false);
          if (heldSaleId) {
            try { await posSaleService.deleteHeld(heldSaleId); } catch { /* ignore */ }
          }
          clearCart();
          return;
        }

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
        if (settings.enableOfflineMode) {
          posOfflineQueue.enqueue({ ...payload, isOffline: true as const });
          window.dispatchEvent(new Event('pos:offline-queue-changed'));
          setLastSale({
            ...payload,
            invoiceNumber: `OFFLINE-${Date.now()}`,
            subtotal,
            grandTotal,
            items: cart,
            payments: payload.payments,
            paidAmount: paidTotal,
            changeAmount: changeDue,
            createdAt: new Date().toISOString(),
            cashierName: `${shift.cashier?.firstName || ''} ${shift.cashier?.lastName || ''}`.trim(),
            terminalName: shift.terminal?.name,
            terminalCode: shift.terminal?.code,
          });
          setShowReceipt(true);
          setShowCheckout(false);
          clearCart();
          setSaleError(`Queued offline: ${e.message}`);
        } else {
          setSaleError(e.message);
        }
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
            currencySymbol: (typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem('sales_selected_currency') || '{}')?.symbol
              : null) || '$',
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
    <div className="flex h-full overflow-hidden font-sans">
      {/* ─── LEFT: Product Browser ──────────────────────────────── */}
      <div className="w-[55%] flex flex-col border-r border-white/7 overflow-hidden">
        <div className="p-3 bg-white/3 border-b border-white/7 space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchRef}
                className="w-full bg-white/6 border border-white/12 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-[#f59e0b] transition-colors"
                placeholder="Search by name or SKU..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
            </div>
            {scannerEnabled && (
              <div className="relative w-[44%] min-w-[160px]">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f59e0b] w-4 h-4" />
                <input
                  ref={scanRef}
                  data-pos-scan="1"
                  className="w-full bg-[#f59e0b]/10 border border-[#f59e0b]/35 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-[#f59e0b] transition-colors"
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
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Scanner ready — scan a product barcode
              </span>
              {scanStatus ? <span className="text-green-400 truncate">{scanStatus}</span> : null}
              {scanError ? <span className="text-red-400 truncate">{scanError}</span> : null}
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleCategorySelect('All')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedCategoryId === 'All'
                  ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                  : 'bg-white/5 border-white/12 text-gray-300 hover:border-[#f59e0b]/50 hover:text-white'
              }`}
            >
              All
            </button>
            {loadingCategories ? (
              <span className="text-gray-500 text-xs flex items-center gap-1.5 px-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Categories...
              </span>
            ) : categories.length === 0 ? (
              <span className="text-gray-500 text-xs px-1">No categories</span>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                      : 'bg-white/5 border-white/12 text-gray-300 hover:border-[#f59e0b]/50 hover:text-white'
                  }`}
                  title={cat.name}
                >
                  {cat.name}
                  {typeof cat.productCount === 'number' ? (
                    <span className="ml-1 opacity-70">({cat.productCount})</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 content-start">
          {loadingProducts ? (
            <div className="col-span-full text-center text-gray-400 py-12">Loading products...</div>
          ) : productError ? (
            <div className="col-span-full text-center text-red-400 py-6">{productError}</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
              {selectedCategoryId !== 'All' && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect('All')}
                  className="mt-3 text-[#f59e0b] text-xs underline"
                >
                  Clear category filter
                </button>
              )}
            </div>
          ) : products.map(p=>(
            <div
              key={p.id}
              className="bg-white/4 border border-white/8 rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-1.5 hover:bg-[#f59e0b]/12"
              onClick={()=>addToCart(p)}
            >
              <div className="w-full h-20 rounded-lg bg-white/6 flex items-center justify-center overflow-hidden">
                {p.mainImage ? (
                  <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover rounded-lg" onError={e=>{ (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <Package className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div className="text-white font-semibold text-xs leading-tight">{p.name}</div>
              {p.sku && <div className="text-gray-400 text-[10px]">{p.sku}</div>}
              {p.categoryName && (
                <div className="text-gray-500 text-[10px] truncate">{p.categoryName}</div>
              )}
              <div className="text-[#f59e0b] font-bold text-base">${p.sellingPrice?.toFixed(2)}</div>
              <div className={`text-[10px] ${p.currentStock <= 0 ? 'text-red-400' : p.currentStock <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                Stock: {p.currentStock}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[45%] flex flex-col overflow-hidden">
        {/* Cart header */}
        <div className="p-3 bg-white/2 border-b border-white/7">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2 m-0">
              <ShoppingCart className="w-4 h-4" />
              Cart <span className="text-gray-400 font-normal text-xs">({cart.length} items)</span>
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1 text-red-400 cursor-pointer text-xs">Clear</button>
            )}
          </div>
          
          {/* Customer Selection - Mandatory */}
          <div className="mt-3 relative">
            <label className="block text-gray-400 text-xs mb-1.5">Customer *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                ref={customerSearchRef}
                className="w-full bg-white/6 border border-white/12 rounded-lg pl-10 pr-10 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
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
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-50 max-h-[200px] overflow-y-auto">
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
                      className="w-full bg-[#f59e0b]/15 border border-[#f59e0b]/30 rounded-lg px-3 py-2 text-[#f59e0b] text-xs font-semibold hover:bg-[#f59e0b]/25 transition-colors flex items-center justify-center gap-2"
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
                      className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="text-white text-xs font-medium">{customer.name}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{customer.phone || customer.email || 'No contact info'}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Customer Credit Info */}
          {selectedCustomer && customerCreditInfo && (
            <div className="mt-2.5 bg-white/4 border border-white/8 rounded-lg p-2.5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-400">Credit Limit:</span>
                <span className="text-white font-medium">${customerCreditInfo.creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-400">Outstanding:</span>
                <span className="text-white font-medium">${customerCreditInfo.outstandingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-400">Available:</span>
                <span className={`${customerCreditInfo.availableCredit >= 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
                  ${customerCreditInfo.availableCredit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Utilization:</span>
                <span className={`${customerCreditInfo.utilization > 80 ? 'text-red-400' : customerCreditInfo.utilization > 50 ? 'text-yellow-400' : 'text-green-400'} font-medium`}>
                  {customerCreditInfo.utilization.toFixed(1)}%
                </span>
              </div>
              {(customerCreditInfo.loyaltyPoints != null || selectedCustomer?.loyaltyPoints != null) && (
                <div className="flex justify-between items-center text-xs mt-1.5">
                  <span className="text-gray-400">Loyalty points:</span>
                  <span className="text-sky-400 font-medium">
                    {customerCreditInfo.loyaltyPoints ?? selectedCustomer?.loyaltyPoints ?? 0}
                  </span>
                </div>
              )}
              {customerCreditInfo.utilization > 80 && (
                <div className="mt-2 text-[10px] text-yellow-400 bg-yellow-400/10 rounded px-2 py-1">
                  ⚠️ Credit limit nearly exceeded
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2.5 mt-2.5">
            <input
              className="flex-1 bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={e=>setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Tap a product to add it to the cart</p>
            </div>
          ) : (
            cart.map(item=>(
              <div key={item.productId} className="bg-white/4 border border-white/8 rounded-xl p-2.5 mb-2 flex gap-2.5 items-start">
                <div className="flex-1">
                  <div className="text-white font-semibold text-xs mb-1">{item.productName}</div>
                  <div className="text-gray-400 text-xs">${item.unitPrice.toFixed(2)} each</div>
                  {/* discount input */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-gray-400 text-[10px]">Disc%:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={e=>updateDiscount(item.productId,parseFloat(e.target.value)||0)}
                      className="w-14 bg-white/6 border border-white/10 rounded-md px-1.5 py-1 text-white text-xs outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={()=>removeFromCart(item.productId)} className="bg-transparent border-none text-red-400 cursor-pointer text-sm">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-[#f59e0b] font-bold text-sm">${item.lineTotal.toFixed(2)}</div>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-lg border border-white/15 bg-transparent text-white cursor-pointer text-sm flex items-center justify-center" onClick={()=>updateQty(item.productId,item.quantity-1)}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-white font-semibold w-8 text-center text-sm">{item.quantity}</span>
                    <button className="w-7 h-7 rounded-lg border border-white/15 bg-transparent text-white cursor-pointer text-sm flex items-center justify-center" onClick={()=>updateQty(item.productId,item.quantity+1)}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-white/7 bg-white/2">
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs items-center gap-2">
              <span className="flex items-center gap-1">
                Disc
                <select
                  value={discountMode}
                  onChange={(e) => setDiscountMode(e.target.value as 'pct' | 'amount')}
                  className="bg-transparent border border-white/20 rounded px-1 text-[10px] text-yellow-400"
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
                  className="w-12 bg-transparent border-none border-b border-white/20 text-yellow-400 outline-none text-xs text-center"
                />
              </span>
              <span className="text-yellow-400">-${discountTotal.toFixed(2)}</span>
            </div>
            {loyaltyPreview > 0 && (
              <div className="flex justify-between text-sky-400 text-xs">
                <span>Loyalty earn</span><span>+{loyaltyPreview} pts</span>
              </div>
            )}
            {heldSaleId && (
              <div className="text-[10px] text-amber-300">Resuming held sale</div>
            )}
            {taxTotal > 0 && (
              <div className="flex justify-between text-gray-400 text-xs">
                <span>{taxContext?.regime || 'Tax'}{pricingModel === 'inclusive' ? ' (incl.)' : ''}</span><span>${taxTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white text-xl font-bold border-t border-white/10 pt-2 mt-1">
              <span>Total</span><span className="text-[#f59e0b]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-bold text-sm cursor-pointer mt-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${cart.length===0?'opacity-50':''}`}
            disabled={cart.length===0}
            onClick={()=>{ setPayments([{ paymentMethod:'Cash', amount:grandTotal, reference:'' }]); setSaleError(''); setShowCheckout(true); }}
          >
            <CreditCard className="w-4 h-4" />
            Checkout — ${grandTotal.toFixed(2)}
          </button>
          <button
            className="w-full py-2.5 rounded-xl border border-white/12 bg-transparent text-gray-400 text-xs cursor-pointer mt-2 hover:bg-white/5 transition-colors"
            onClick={holdSale}
            disabled={cart.length===0}
          >
            ⏸️ Hold Sale
          </button>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150]">
          <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-7 w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <h2 className="text-white text-xl font-semibold m-0 mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Checkout
            </h2>

            {(saleError || chargeError) && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs mb-4">
                {saleError || chargeError}
              </div>
            )}

            <div className="bg-white/4 rounded-xl p-3.5 mb-4 max-h-[150px] overflow-y-auto">
              {cart.map(item=>(
                <div key={item.productId} className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-300">{item.productName} × {item.quantity}</span>
                  <span className="text-white font-semibold">${item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3 mb-4">
              {overallDiscount > 0 && (
                <div className="flex justify-between text-yellow-400 text-xs mb-1">
                  <span>Discount ({overallDiscount}%)</span><span>-${discountTotal.toFixed(2)}</span>
                </div>
              )}
              {taxTotal > 0 && (
                <div className="flex justify-between text-gray-400 text-xs mb-1">
                  <span>{taxContext?.regime || 'Tax'}{pricingModel === 'inclusive' ? ' (incl.)' : ''}</span><span>${taxTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white text-xl font-bold">
                <span>Total</span><span className="text-[#f59e0b]">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-gray-400 text-xs">Payment</label>
                <button
                  onClick={addPayment}
                  className="bg-transparent border border-[#f59e0b]/40 text-[#f59e0b] rounded-lg px-2.5 py-1 cursor-pointer text-xs"
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
                      className="flex-1 bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-xs outline-none"
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
                      className="w-24 bg-white/6 border border-white/12 rounded-lg px-2 py-2 text-white text-xs outline-none disabled:opacity-60"
                      placeholder="Amount"
                    />
                    {payments.length > 1 && (
                      <button onClick={()=>removePayment(i)} className="bg-transparent border-none text-red-400 cursor-pointer text-sm">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {methodNeedsPaymentDevice(pmt.paymentMethod) && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      {pmt.terminalApproved ? (
                        <span className="text-green-400 text-[11px] font-semibold">
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
                className="w-full py-2 rounded-lg border border-dashed border-[#f59e0b]/40 bg-transparent text-[#f59e0b] cursor-pointer text-xs mt-1 hover:bg-[#f59e0b]/5 transition-colors"
              >
                💡 Set exact amount: ${grandTotal.toFixed(2)}
              </button>
            </div>

            {/* Change */}
            {changeDue !== 0 && (
              <div className={`p-2.5 rounded-lg border mb-3.5 flex justify-between ${
                changeDue>=0
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <span className={`${changeDue>=0?'text-green-400':'text-red-400'} font-semibold text-sm`}>
                  {changeDue>=0?'Change Due':'Still Owed'}
                </span>
                <span className={`${changeDue>=0?'text-green-400':'text-red-400'} font-bold text-lg`}>
                  ${Math.abs(changeDue).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={()=>setShowCheckout(false)}
                className="flex-1 py-3 rounded-lg bg-transparent border border-white/12 text-gray-400 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
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
                  <Nfc className="w-8 h-8 text-sky-300" />
                </div>
                <p className="text-white text-lg font-semibold m-0">Present card on {loadPosSettings().paymentTerminalModel}</p>
                <p className="text-[#f59e0b] text-2xl font-bold mt-2 mb-1">
                  ${(payments[chargingIndex]?.amount || grandTotal).toFixed(2)}
                </p>
                <p className="text-gray-400 text-xs mb-5">Chip, tap or swipe — waiting for the payment device</p>
                {chargeError ? <p className="text-red-400 text-xs mb-3">{chargeError}</p> : null}
                <button
                  type="button"
                  onClick={() => { void cancelPaymentTerminalSale(); setChargingIndex(null); }}
                  className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 text-xs"
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
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-[#f59e0b]" />
                  Add New Customer
                </h3>
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
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
                    className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                    placeholder="customer@email.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                    placeholder="Company name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Customer Type</label>
                  <select
                    value={newCustomer.customerType}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, customerType: e.target.value as any }))}
                    className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
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
                      className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
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
                      className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="block text-gray-400 text-xs mb-2">Address</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCustomer.address.city}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                      className="bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={newCustomer.address.state}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                      className="bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={newCustomer.address.postalCode}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, postalCode: e.target.value } }))}
                      className="bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                      placeholder="Postal Code"
                    />
                    <input
                      type="text"
                      value={newCustomer.address.country}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))}
                      className="bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#f59e0b] transition-colors"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-transparent border border-white/12 text-gray-400 text-sm cursor-pointer hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer}
                  className="flex-[2] py-2.5 rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#d97706] border-none text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
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
