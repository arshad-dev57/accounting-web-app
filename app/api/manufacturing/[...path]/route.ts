import { NextRequest } from 'next/server';
import { proxyToMfgBackend } from '@/lib/mfg-backend-proxy';

type Params = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const backendPath = `/${(path || []).join('/')}`;
  return proxyToMfgBackend(request, backendPath);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
