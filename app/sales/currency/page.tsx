'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Search, Check } from 'lucide-react';
import CurrencyList from 'currency-list';
import countryToCurrency from 'country-to-currency';

// Dynamically build currencyToCountry from country-to-currency package
const currencyToCountry: Record<string, string> = {};
for (const [countryCode, currencyCode] of Object.entries(countryToCurrency)) {
  if (!currencyToCountry[currencyCode]) {
    currencyToCountry[currencyCode] = countryCode;
  }
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface SelectedCurrency {
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  countryCode?: string;
}

export default function CurrencyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<SelectedCurrency | null>(null);

  // Get all currencies from currency-list package
  const allCurrencies = Object.values(CurrencyList.getAll('en_US')) as any[];

  useEffect(() => {
    const savedCurrency = localStorage.getItem('sales_selected_currency');
    if (savedCurrency) {
      setSelectedCurrency(JSON.parse(savedCurrency));
    }
  }, []);

  const saveSelectedCurrency = (currency: SelectedCurrency) => {
    setSelectedCurrency(currency);
    localStorage.setItem('sales_selected_currency', JSON.stringify(currency));
  };

  const handleSelectCurrency = async (currency: any) => {
    console.log('🔄 [Currency] Selecting currency:', currency.code, currency.symbol);

    const currencyData: SelectedCurrency = {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      symbolNative: currency.symbol_native,
      countryCode: currencyToCountry[currency.code],
    };

    // Save to localStorage
    console.log('💾 [Currency] Saving to localStorage:', currencyData);
    saveSelectedCurrency(currencyData);
    console.log('✅ [Currency] Saved to localStorage successfully');

    // Also sync with API
    try {
      console.log('📤 [Currency] Sending to API: /api/users/currency');
      const response = await fetch('/api/users/currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
        }),
      });

      console.log('📥 [Currency] API Response Status:', response.status);
      const result = await response.json();
      console.log('📥 [Currency] API Response Data:', result);

      if (response.ok) {
        console.log('✅ [Currency] Synced with server successfully');
        alert(`Currency saved successfully: ${currency.name} (${currency.symbol})`);
      } else {
        console.error('❌ [Currency] Failed to sync with server:', result.message);
        alert(`Failed to sync currency: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [Currency] Error syncing with server:', error);
      alert('Error syncing currency with server');
    }
  };

  const filteredCurrencies = allCurrencies.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-[#7c4dff]" />
          Currency Selection
        </h1>
      </div>

      {/* Selected Currency Display */}
      {selectedCurrency ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Selected Currency</h2>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#7c4dff]/10 rounded-xl flex items-center justify-center text-3xl">
              {getFlagEmoji(selectedCurrency.countryCode || '')}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{selectedCurrency.name}</p>
              <p className="text-sm text-gray-500">
                {selectedCurrency.code} • {selectedCurrency.symbol}
                {selectedCurrency.symbolNative !== selectedCurrency.symbol && ` • ${selectedCurrency.symbolNative}`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No currency selected. Select a currency below.</p>
          </div>
        </div>
      )}

      {/* All Currencies List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-800">All World Currencies</h2>
            <p className="text-xs text-gray-500 mt-1">
              Showing {filteredCurrencies.length} of {allCurrencies.length} currencies
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Flag</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Symbol</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Native</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCurrencies.map((c: any) => {
                const countryCode = currencyToCountry[c.code];
                return (
                  <tr
                    key={c.code}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${selectedCurrency?.code === c.code ? 'bg-[#7c4dff]/5' : ''}`}
                  >
                    <td className="py-3 px-4 text-2xl">{countryCode ? getFlagEmoji(countryCode) : '🏳️'}</td>
                    <td className="py-3 px-4 font-mono text-sm font-semibold text-[#7c4dff]">{c.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{c.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{c.symbol}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{c.symbol_native}</td>
                    <td className="py-3 px-4">
                      {selectedCurrency?.code === c.code ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          Selected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectCurrency(c)}
                          className="px-3 py-1.5 bg-[#7c4dff] text-white text-sm rounded-lg hover:bg-[#6b3ee0] transition-all"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCurrencies.length === 0 && (
          <div className="text-center py-8 text-gray-500">No currencies found</div>
        )}
      </div>
    </div>
  );
}