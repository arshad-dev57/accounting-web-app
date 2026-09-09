// app/api/hr/shifts/route.ts
// HR Shifts API — list + create. Protected by the standard auth_token cookie.

import { NextRequest, NextResponse } from 'next/server';
import { listShifts, createShift, validateShiftInput } from '@/lib/hr-shifts-store';
import { listEmployees } from '@/lib/hr-employees-store';

function getToken(request: NextRequest) {
  return (
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const shifts = listShifts();
    // Count employees per shift (by shift name, as stored on employees)
    const employees = listEmployees();
    const data = shifts.map((s) => ({
      ...s,
      employees: employees.filter(
        (e) => e.shift.toLowerCase() === s.name.toLowerCase()
      ).length,
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error: any) {
    console.error('GET /api/hr/shifts error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to list shifts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { valid, errors, data } = validateShiftInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }

    // Prevent duplicate shift names
    const existing = listShifts();
    if (existing.some((s) => s.name.toLowerCase() === data.name.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'A shift with this name already exists' },
        { status: 409 }
      );
    }

    const shift = createShift(data);
    return NextResponse.json(
      { success: true, data: shift, message: 'Shift created' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/hr/shifts error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create shift' },
      { status: 500 }
    );
  }
}