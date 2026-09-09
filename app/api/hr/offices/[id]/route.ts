
import { NextRequest, NextResponse } from 'next/server';
import {
  getOffice,
  updateOffice,
  deleteOffice,
  validateOfficeInput,
} from '@/lib/hr-offices-store';
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
    const office = getOffice(id);
    if (!office) {
      return NextResponse.json(
        { success: false, message: 'Office not found' },
        { status: 404 }
      );
    }
    const employees = listEmployees().filter(
      (e) => e.office.toLowerCase() === office.name.toLowerCase()
    ).length;
    return NextResponse.json({ success: true, data: { ...office, employees } });
  } catch (error: any) {
    console.error('GET /api/hr/offices/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get office' },
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
    const { valid, errors, data } = validateOfficeInput(body);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: errors.join('. '), errors },
        { status: 400 }
      );
    }
    const office = updateOffice(id, data);
    if (!office) {
      return NextResponse.json(
        { success: false, message: 'Office not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: office,
      message: 'Office updated',
    });
  } catch (error: any) {
    console.error('PUT /api/hr/offices/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update office' },
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
    const deleted = deleteOffice(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Office not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Office deleted' });
  } catch (error: any) {
    console.error('DELETE /api/hr/offices/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete office' },
      { status: 500 }
    );
  }
}
