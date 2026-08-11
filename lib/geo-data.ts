import { getData as getCountryData } from 'country-list';
import countryToCurrency from 'country-to-currency';
import * as currencyCodes from 'currency-codes';
import CurrencyListDefault from 'currency-list';
import {
  getCountries as getPhoneCountries,
  getCountryCallingCode,
  isSupportedCountry,
  type CountryCode,
} from 'libphonenumber-js';

export type GeoCountry = {
  name: string;
  code: string;
  dial: string;
  currency: string;
};

export type GeoCurrency = {
  code: string;
  name: string;
  symbol: string;
};

export type DialOption = {
  countryCode: string;
  countryName: string;
  dial: string;
  label: string;
};

// currency-list is CJS with default export
const CurrencyList = (CurrencyListDefault as any).default || CurrencyListDefault;

function currencySymbol(code: string): string {
  try {
    const info = CurrencyList.get?.(code, 'en');
    if (info?.symbol) return String(info.symbol);
  } catch {
    /* ignore */
  }
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value || code
    );
  } catch {
    return code;
  }
}

const phoneCountrySet = new Set(getPhoneCountries());

function buildCountries(): GeoCountry[] {
  const map = countryToCurrency as Record<string, string>;

  return getCountryData()
    .map((c) => {
      const code = String(c.code || '').toUpperCase();
      let dial = '';
      if (phoneCountrySet.has(code as CountryCode) && isSupportedCountry(code as CountryCode)) {
        try {
          dial = `+${getCountryCallingCode(code as CountryCode)}`;
        } catch {
          dial = '';
        }
      }
      return {
        name: c.name,
        code,
        dial,
        currency: map[code] || '',
      };
    })
    .filter((c) => c.name && c.code)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCurrencies(): GeoCurrency[] {
  const rows = (currencyCodes as any).data as Array<{
    code: string;
    currency: string;
  }>;

  return rows
    .filter((c) => c.code && c.currency)
    .map((c) => ({
      code: c.code,
      name: c.currency,
      symbol: currencySymbol(c.code),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

function buildDialOptions(countries: GeoCountry[]): DialOption[] {
  return countries
    .filter((c) => c.dial)
    .map((c) => ({
      countryCode: c.code,
      countryName: c.name,
      dial: c.dial,
      label: `${c.dial} · ${c.name}`,
    }));
}

export const GEO_COUNTRIES: GeoCountry[] = buildCountries();
export const GEO_CURRENCIES: GeoCurrency[] = buildCurrencies();
export const GEO_DIAL_OPTIONS: DialOption[] = buildDialOptions(GEO_COUNTRIES);

export function findCountryByName(name: string): GeoCountry | undefined {
  return GEO_COUNTRIES.find((c) => c.name === name);
}

export function findCountryByCode(code: string): GeoCountry | undefined {
  return GEO_COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function findCurrency(code: string): GeoCurrency | undefined {
  return GEO_CURRENCIES.find((c) => c.code === code);
}

export function findDialOption(countryCode: string): DialOption | undefined {
  return GEO_DIAL_OPTIONS.find((d) => d.countryCode === countryCode.toUpperCase());
}
