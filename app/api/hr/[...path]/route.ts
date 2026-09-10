import { NextRequest } from 'next/server';
import { proxyToHrBackend } from '@/lib/hr-backend-proxy';

type Params = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const backendPath = `/${(path || []).join('/')}`;
  return proxyToHrBackend(request, backendPath);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
