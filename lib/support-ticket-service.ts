'use client';

import { apiClient } from '../app/lib/api-client';
import { API_BASE_URL } from '../app/lib/constants';

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  stepsToReproduce?: string | null;
  attachmentUrl?: string | null;
  adminResponse?: string | null;
  module?: string | null;
  userId: string;
  companyId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export const SUPPORT_CATEGORIES = [
  'Bug',
  'Crash',
  'Performance',
  'UI Issue',
  'Data Error',
  'Billing',
  'Feature Request',
  'General',
  'Other',
] as const;

export const SUPPORT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export const SUPPORT_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export const supportTicketService = {
  async list(params?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return apiClient.get(`/api/support/tickets${qs ? `?${qs}` : ''}`);
  },

  async get(id: string) {
    return apiClient.get(`/api/support/tickets/${id}`);
  },

  async create(payload: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
    stepsToReproduce?: string;
    module?: string;
    attachment?: File | null;
  }) {
    const fd = new FormData();
    fd.append('title', payload.title);
    fd.append('description', payload.description);
    if (payload.category) fd.append('category', payload.category);
    if (payload.priority) fd.append('priority', payload.priority);
    if (payload.stepsToReproduce) fd.append('stepsToReproduce', payload.stepsToReproduce);
    if (payload.module) fd.append('module', payload.module);
    if (payload.attachment) fd.append('attachment', payload.attachment);

    const token =
      (typeof window !== 'undefined' && localStorage.getItem('auth_token')) || '';
    const res = await fetch(
      `${API_BASE_URL}/api/support/tickets`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }
    );
    return res.json();
  },

  async update(
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      category: string;
      priority: string;
      status: string;
      stepsToReproduce: string;
      adminResponse: string;
      module: string;
    }>
  ) {
    return apiClient.put(`/api/support/tickets/${id}`, payload);
  },

  async remove(id: string) {
    return apiClient.delete(`/api/support/tickets/${id}`);
  },
};
