// app/api/hr/offices/route.ts
// HR Offices API — list + create. Protected by the standard auth_token cookie.

import { NextRequest, NextResponse } from 'next/server';
import { listOffices, createOffice, validateOfficeInput } from '@/lib/hr-offices-store';
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

    const offices = listOffices();
    // Count employees per office (by office name, as stored on employees)
    const employees = listEmployees();
    const data = offices.map((o) => ({
      ...o,
      employees: employees.filter(
        (e) => e.office.toLowerCase() === o.name.toLowerCase()
      ).length,
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error: any) {
    console.error('GET /api/hr/offices error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to list offices' },
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
    const { valid, errors, data } = validateOfficeInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }

    // Prevent duplicate office names / codes
    const existing = listOffices();
    if (existing.some((o) => o.name.toLowerCase() === data.name.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'An office with this name already exists' },
        { status: 409 }
      );
    }
    if (data.code && existing.some((o) => o.code.toLowerCase() === data.code.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'An office with this code already exists' },
        { status: 409 }
      );
    }

    const office = createOffice(data);
    return NextResponse.json(
      { success: true, data: office, message: 'Office created' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/hr/offices error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create office' },
      { status: 500 }
    );
  }
}
