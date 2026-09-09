// app/api/hr/holidays/route.ts
// HR Holidays API — list + create. Protected by the standard auth_token cookie.

import { NextRequest, NextResponse } from 'next/server';
import {
  listHolidays,
  createHoliday,
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

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const holidays = listHolidays();
    const data = holidays.map((h) => ({ ...h, day: holidayDay(h.date) }));

    return NextResponse.json({ success: true, data, total: data.length });
  } catch (error: any) {
    console.error('GET /api/hr/holidays error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to list holidays' },
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
    const { valid, errors, data } = validateHolidayInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }

    // Prevent duplicate holidays (same name)
    const existing = listHolidays();
    if (existing.some((h) => h.name.toLowerCase() === data.name.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'A holiday with this name already exists' },
        { status: 409 }
      );
    }

    const holiday = createHoliday(data);
    return NextResponse.json(
      { success: true, data: holiday, message: 'Holiday created' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/hr/holidays error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create holiday' },
      { status: 500 }
    );
  }
}