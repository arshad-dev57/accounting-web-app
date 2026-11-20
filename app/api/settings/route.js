import { NextResponse } from 'next/server';
import axios from 'axios';
import { backendProxyHeaders, browserCompanyAuthHeaders } from '@/lib/company-api-headers';

const BACKEND_URL = (process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function GET(request) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category is required' },
        { status: 400 }
      );
    }
    const response = await axios.get(`${BACKEND_URL}/api/settings`, {
      headers,
      params: { category },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to load settings',
      },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const response = await axios.post(`${BACKEND_URL}/api/settings`, body, { headers });
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create setting',
      },
      { status }
    );
  }
}

function unwrapSettingsPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
  return [];
}

async function parseJson(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

/** Browser client — uses same-origin proxy with auth headers. */
export const settingService = {
  getSettings: async (category) => {
    const response = await fetch(
      `/api/settings?category=${encodeURIComponent(category)}`,
      {
        headers: browserCompanyAuthHeaders(),
        cache: 'no-store',
      }
    );
    const result = await parseJson(response);
    return unwrapSettingsPayload(result);
  },
  createSetting: async (data) => {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await parseJson(response);
    return result.data ?? result;
  },
  updateSetting: async (id, data) => {
    const response = await fetch(`/api/settings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await parseJson(response);
    return result.data ?? result;
  },
  deleteSetting: async (id) => {
    const response = await fetch(`/api/settings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: browserCompanyAuthHeaders(),
    });
    await parseJson(response);
  },
};
