// app/api/hr/shifts/[id]/route.ts
// HR Shifts API — get / update / delete a single shift.

import { NextRequest, NextResponse } from 'next/server';
import {
  getShift,
  updateShift,
  deleteShift,
  validateShiftInput,
} from '@/lib/hr-shifts-store';
import { listEmployees } from '@/lib/hr-employees-store';

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
    const shift = getShift(id);
    if (!shift) {
      return NextResponse.json(
        { success: false, message: 'Shift not found' },
        { status: 404 }
      );
    }
    const employees = listEmployees().filter(
      (e) => e.shift.toLowerCase() === shift.name.toLowerCase()
    ).length;
    return NextResponse.json({ success: true, data: { ...shift, employees } });
  } catch (error: any) {
    console.error('GET /api/hr/shifts/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get shift' },
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
    const { valid, errors, data } = validateShiftInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }
    const shift = updateShift(id, data);
    if (!shift) {
      return NextResponse.json(
        { success: false, message: 'Shift not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: shift,
      message: 'Shift updated',
    });
  } catch (error: any) {
    console.error('PUT /api/hr/shifts/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update shift' },
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
    const deleted = deleteShift(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Shift not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Shift deleted' });
  } catch (error: any) {
    console.error('DELETE /api/hr/shifts/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete shift' },
      { status: 500 }
    );
  }
}