// app/api/settings/route.js
import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category is required' },
        { status: 400 }
      );
    }

    const response = await apiClient.get(`/api/settings?category=${category}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await apiClient.post('/api/settings', body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('POST /settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split('/').pop();
    const body = await request.json();
    const response = await apiClient.put(`/api/settings/${id}`, body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('PUT /settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split('/').pop();
    const response = await apiClient.delete(`/api/settings/${id}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('DELETE /settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export const settingService = {
  getSettings: async (category) => {
    const response = await apiClient.get(`/api/settings?category=${category}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch settings');
    }
    // ✅ Return the array from response.data
    return response.data?.data || [];
  },
  createSetting: async (data) => {
    const response = await apiClient.post('/api/settings', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create setting');
    }
    return response.data?.data;
  },
  updateSetting: async (id, data) => {
    const response = await apiClient.put(`/api/settings/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update setting');
    }
    return response.data?.data;
  },
  deleteSetting: async (id) => {
    const response = await apiClient.delete(`/api/settings/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete setting');
    }
  },
};