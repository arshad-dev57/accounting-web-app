'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useCompanyOptional } from '@/lib/company-context';

export type CompanyBusinessConfig = {
  id?: string | null;
  companyId?: string | null;
  operationalBusinessType: string;
  salesModel: 'standard' | 'installment' | 'both' | string;
  purchaseModel: 'standard' | 'installment' | string;
  installmentRevenuePolicy: string;
  allowChildConfigOverride: boolean;
  inheritedFromParent: boolean;
  sourceParentCompanyId?: string | null;
  canEdit?: boolean;
  capabilities?: {
    allowStandardSales: boolean;
    allowInstallmentSales: boolean;
    allowStandardPurchase: boolean;
    allowInstallmentPurchase: boolean;
    showInstallmentSalesUi: boolean;
    showInstallmentPurchaseUi: boolean;
  };
  parentPolicy?: {
    parentCompanyId: string;
    allowChildConfigOverride: boolean;
  } | null;
  options?: {
    operationalBusinessTypes: string[];
    salesModels: string[];
    purchaseModels: string[];
    installmentRevenuePolicies: string[];
  };
  warnings?: string[];
};

const DEFAULT_CONFIG: CompanyBusinessConfig = {
  operationalBusinessType: 'Other',
  salesModel: 'standard',
  purchaseModel: 'standard',
  installmentRevenuePolicy: 'full_on_sale',
  allowChildConfigOverride: true,
  inheritedFromParent: false,
  capabilities: {
    allowStandardSales: true,
    allowInstallmentSales: false,
    allowStandardPurchase: true,
    allowInstallmentPurchase: false,
    showInstallmentSalesUi: false,
    showInstallmentPurchaseUi: false,
  },
};

export async function fetchCompanyBusinessConfig(): Promise<CompanyBusinessConfig> {
  const res = await apiClient.get('/api/companies/business-config');
  const data = res.data?.data || res.data;
  return { ...DEFAULT_CONFIG, ...data };
}

export async function updateCompanyBusinessConfig(
  patch: Partial<CompanyBusinessConfig>
): Promise<CompanyBusinessConfig> {
  const res = await apiClient.patch('/api/companies/business-config', patch);
  const data = res.data?.data || res.data;
  return { ...DEFAULT_CONFIG, ...data, warnings: res.data?.warnings || data?.warnings };
}

export function useCompanyBusinessConfig() {
  const company = useCompanyOptional();
  const activeId = company?.activeCompanyId || null;
  const [config, setConfig] = useState<CompanyBusinessConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!activeId || activeId === 'all') {
      setConfig(DEFAULT_CONFIG);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanyBusinessConfig();
      setConfig(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err as any).response?.data?.message || 'Failed to load business configuration'
          : 'Failed to load business configuration';
      setError(String(message));
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    config,
    loading,
    error,
    refresh,
    setConfig,
    showInstallmentSalesUi: Boolean(config.capabilities?.showInstallmentSalesUi),
    showInstallmentPurchaseUi: Boolean(config.capabilities?.showInstallmentPurchaseUi),
    allowInstallmentSales: Boolean(config.capabilities?.allowInstallmentSales),
    allowStandardSales: config.capabilities?.allowStandardSales !== false,
  };
}

export { DEFAULT_CONFIG };
