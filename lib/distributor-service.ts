import { browserCompanyAuthHeaders } from "@/lib/company-api-headers";

const API_BASE = "http://localhost:5000/api/distributor";

export async function fetchDistributorDashboard() {
  const headers = browserCompanyAuthHeaders();
  const res = await fetch(`${API_BASE}/dashboard`, { headers });
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function fetchSalespersons(params?: { search?: string; status?: string; territory?: string }) {
  const headers = browserCompanyAuthHeaders();
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/salespersons?${query}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch salespersons");
  return res.json();
}

export async function createSalesperson(data: any) {
  const headers = { ...browserCompanyAuthHeaders(), "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}/salespersons`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create salesperson");
  return res.json();
}

export async function fetchSalesperson360(id: string) {
  const headers = browserCompanyAuthHeaders();
  const res = await fetch(`${API_BASE}/salespersons/${id}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch salesperson details");
  return res.json();
}

export async function fetchCustomer360(id: string) {
  const headers = browserCompanyAuthHeaders();
  const res = await fetch(`${API_BASE}/customers/${id}/360`, { headers });
  if (!res.ok) throw new Error("Failed to fetch customer 360");
  return res.json();
}

export async function fetchCustomerLedger(id: string, params?: { startDate?: string; endDate?: string; page?: number }) {
  const headers = browserCompanyAuthHeaders();
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/customers/${id}/ledger?${query}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch customer ledger");
  return res.json();
}

export async function fetchCustomerStatement(id: string, params?: { startDate?: string; endDate?: string }) {
  const headers = browserCompanyAuthHeaders();
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/customers/${id}/statement?${query}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch customer statement");
  return res.json();
}

export async function checkCreditLimit(customerId: string, newAmount: number) {
  const headers = { ...browserCompanyAuthHeaders(), "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}/customers/check-credit-limit`, {
    method: "POST",
    headers,
    body: JSON.stringify({ customerId, newAmount })
  });
  if (!res.ok) throw new Error("Failed to run credit check");
  return res.json();
}

export async function fetchCollectionsWorkspace(params?: { salespersonId?: string; territory?: string; statusFilter?: string }) {
  const headers = browserCompanyAuthHeaders();
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/collections?${query}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch collections workspace");
  return res.json();
}

export async function fetchCustomerAgingReport(params?: { salespersonId?: string; locationId?: string }) {
  const headers = browserCompanyAuthHeaders();
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/reports/customer-aging?${query}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch aging report");
  return res.json();
}

export async function fetchSalespersonRecoveryReport(params?: { startDate?: string; endDate?: string }) {
  const headers = browserCompanyAuthHeaders();
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/reports/salesperson-recovery?${query}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch recovery report");
  return res.json();
}

export async function fetchProductAnalytics(id: string) {
  const headers = browserCompanyAuthHeaders();
  const res = await fetch(`${API_BASE}/products/${id}/analytics`, { headers });
  if (!res.ok) throw new Error("Failed to fetch product analytics");
  return res.json();
}

export async function fetchWarehouse360(locationId: string) {
  const headers = browserCompanyAuthHeaders();
  const res = await fetch(`${API_BASE}/warehouses/${locationId}/360`, { headers });
  if (!res.ok) throw new Error("Failed to fetch warehouse 360");
  return res.json();
}
