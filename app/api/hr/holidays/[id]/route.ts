// app/api/hr/holidays/[id]/route.ts
// HR Holidays API — get / update / delete a single holiday.

import { NextRequest, NextResponse } from 'next/server';
import {
  getHoliday,
  updateHoliday,
  deleteHoliday,
  validateHolidayInput,
  holidayDay,
} from '@/lib/hr-holidays-store';

function getToken(request: NextRequest) {
  return (
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const holiday = getHoliday(id);
    if (!holiday) {
      return NextResponse.json(
        { success: false, message: 'Holiday not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: { ...holiday, day: holidayDay(holiday.date) },
    });
  } catch (error: any) {
    console.error('GET /api/hr/holidays/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get holiday' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { valid, errors, data } = validateHolidayInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }
    const holiday = updateHoliday(id, data);
    if (!holiday) {
      return NextResponse.json(
        { success: false, message: 'Holiday not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: holiday,
      message: 'Holiday updated',
    });
  } catch (error: any) {
    console.error('PUT /api/hr/holidays/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update holiday' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const deleted = deleteHoliday(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Holiday not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Holiday deleted' });
  } catch (error: any) {
    console.error('DELETE /api/hr/holidays/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}