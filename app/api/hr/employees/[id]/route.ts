// app/api/hr/employees/[id]/route.ts
// HR Employees API — get / update / delete a single employee.

import { NextRequest, NextResponse } from 'next/server';
import {
  getEmployee,
  updateEmployee,
  deleteEmployee,
  validateEmployeeInput,
} from '@/lib/hr-employees-store';

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
    const employee = getEmployee(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    console.error('GET /api/hr/employees/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get employee' },
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
    const { valid, errors, data } = validateEmployeeInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }
    const employee = updateEmployee(id, data);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee updated',
    });
  } catch (error: any) {
    console.error('PUT /api/hr/employees/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update employee' },
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
    const deleted = deleteEmployee(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Employee deleted' });
  } catch (error: any) {
    console.error('DELETE /api/hr/employees/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
