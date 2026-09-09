// app/api/hr/tracking/route.ts
// Live GPS pings from mobile + live map feed for HR admin.

import { NextRequest, NextResponse } from 'next/server';
import {
  listLiveTracking,
  listAttendance,
  processLocationPing,
} from '@/lib/hr-tracking-store';

function getToken(request: NextRequest) {
  return (
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function withCors(res: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return res;
}

export async function OPTIONS(request: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }), request);
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        ),
        request
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    return withCors(
      NextResponse.json({
        success: true,
        data: {
          live: listLiveTracking(),
          attendance: listAttendance(date || undefined),
          serverTime: new Date().toISOString(),
        },
      }),
      request
    );
  } catch (error: any) {
    console.error('GET /api/hr/tracking error:', error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || 'Failed to load tracking' },
        { status: 500 }
      ),
      request
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        ),
        request
      );
    }

    const body = await request.json().catch(() => ({}));
    const employeeId = String(body.employeeId || '').trim();
    const employeeName = String(body.employeeName || 'Employee').trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!employeeId) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'employeeId is required' },
          { status: 400 }
        ),
        request
      );
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: 'Valid latitude and longitude are required',
          },
          { status: 400 }
        ),
        request
      );
    }

    const result = processLocationPing({
      employeeId,
      employeeName,
      officeId: body.officeId,
      officeName: body.officeName,
      latitude,
      longitude,
      accuracy: body.accuracy != null ? Number(body.accuracy) : undefined,
      speed: body.speed != null ? Number(body.speed) : undefined,
      battery: body.battery != null ? Number(body.battery) : undefined,
      heading: body.heading != null ? Number(body.heading) : undefined,
      isBackground: !!body.isBackground,
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: result.message,
        data: result,
      }),
      request
    );
  } catch (error: any) {
    console.error('POST /api/hr/tracking error:', error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || 'Failed to process ping' },
        { status: 500 }
      ),
      request
    );
  }
}
