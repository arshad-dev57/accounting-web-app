// app/api/hr/employees/route.ts
// HR Employees API — list + create. Employees are separate from ERP users.
// Protected by the standard auth_token cookie. Does not touch any other API.

import { NextRequest, NextResponse } from 'next/server';
import {
  listEmployees,
  createEmployee,
  validateEmployeeInput,
} from '@/lib/hr-employees-store';

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

    const { searchParams } = request.nextUrl;
    const q = (searchParams.get('q') || '').toLowerCase();
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';

    let employees = listEmployees();
    if (q) {
      employees = employees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      );
    }
    if (status) {
      employees = employees.filter((e) => e.status === status);
    }
    if (department) {
      employees = employees.filter((e) => e.department === department);
    }

    return NextResponse.json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error: any) {
    console.error('GET /api/hr/employees error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to list employees' },
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
    const { valid, errors, data } = validateEmployeeInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }

    const employee = createEmployee(data);
    return NextResponse.json(
      { success: true, data: employee, message: 'Employee created' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/hr/employees error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}
