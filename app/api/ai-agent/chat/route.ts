import { NextResponse } from 'next/server';
import axios from 'axios';
import { backendProxyHeaders } from '@/lib/company-api-headers';
import { localAssistantReply } from '@/lib/ai-agent-knowledge';
import {
  emptySalesSession,
  handleSalesFlowTurn,
  type AgentCustomer,
  type AgentProduct,
  type SalesFlowSession,
} from '@/lib/ai-agent/sales-flow';

export const dynamic = 'force-dynamic';

const BACKEND_URL = (process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');

type Body = {
  message?: string;
  session?: SalesFlowSession | null;
};

function unwrapList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

export async function POST(request: Request) {
  try {
    const { token, headers } = backendProxyHeaders(request as any);
    const body = (await request.json().catch(() => ({}))) as Body;
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    const sessionIn = body.session || emptySalesSession();

    const searchCustomers = async (q: string): Promise<AgentCustomer[]> => {
      if (!token) return [];
      try {
        const res = await axios.get(`${BACKEND_URL}/api/warehouse/customers/search`, {
          headers,
          params: { q, limit: 8 },
        });
        return unwrapList(res.data)
          .map((c: any) => ({
            id: String(c.id),
            name: String(c.name || c.customerName || ''),
            email: c.email || null,
            phone: c.phone || null,
          }))
          .filter((c: AgentCustomer) => c.id && c.name);
      } catch {
        // fallback list endpoint
        try {
          const res = await axios.get(`${BACKEND_URL}/api/warehouse/customers`, {
            headers,
            params: { search: q, page: 1, limit: 8 },
          });
          return unwrapList(res.data)
            .map((c: any) => ({
              id: String(c.id),
              name: String(c.name || ''),
              email: c.email || null,
              phone: c.phone || null,
            }))
            .filter((c: AgentCustomer) => c.id && c.name);
        } catch {
          return [];
        }
      }
    };

    const searchProducts = async (q: string): Promise<AgentProduct[]> => {
      if (!token) return [];
      try {
        const res = await axios.get(`${BACKEND_URL}/api/warehouse/products`, {
          headers,
          params: { search: q, page: 1, limit: 8 },
        });
        return unwrapList(res.data)
          .map((p: any) => ({
            id: String(p.id),
            name: String(p.name || p.productName || ''),
            sku: p.sku || '',
            unitPrice: Number(p.sellingPrice ?? p.unitPrice ?? 0) || 0,
            sellingPrice: Number(p.sellingPrice ?? 0) || 0,
          }))
          .filter((p: AgentProduct) => p.id && p.name);
      } catch {
        return [];
      }
    };

    const createSalesOrder = async ({
      customer,
      lines,
    }: {
      customer: AgentCustomer;
      lines: { productId: string; productName: string; sku: string; quantity: number; unitPrice: number }[];
    }) => {
      if (!token) {
        throw new Error('Please log in again to create an order');
      }
      const payload = {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || undefined,
        customerPhone: customer.phone || undefined,
        source: 'ai-agent',
        orderStatus: 'Draft',
        paymentStatus: 'Unpaid',
        items: lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          sku: l.sku,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      };
      const res = await axios.post(`${BACKEND_URL}/api/warehouse/order/sales`, payload, { headers });
      const data = res.data?.data || res.data;
      return {
        id: data?.id,
        orderNumber: data?.orderNumber || data?.order_number,
      };
    };

    const salesResult = await handleSalesFlowTurn(message, sessionIn, {
      searchCustomers,
      searchProducts,
      createSalesOrder,
    });

    if (salesResult) {
      return NextResponse.json({
        success: true,
        data: {
          role: 'assistant',
          content: salesResult.reply,
          source: 'sales-flow',
          session: salesResult.session,
          suggestions: salesResult.suggestions || [],
        },
      });
    }

    // FAQ / assumption-based help (no API key)
    const reply = localAssistantReply(message);
    return NextResponse.json({
      success: true,
      data: {
        role: 'assistant',
        content: reply,
        source: 'local',
        session: sessionIn?.intent === 'sales_order' ? sessionIn : emptySalesSession(sessionIn?.lang || 'en'),
        suggestions: [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to get assistant reply',
      },
      { status: error?.response?.status || 500 }
    );
  }
}
