import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencyCode, currencySymbol } = body;

    if (!currencyCode || !currencySymbol) {
      return NextResponse.json(
        { success: false, message: 'Currency code and symbol are required' },
        { status: 400 }
      );
    }

    // TODO: Save to database when backend is ready
    // For now, return success
    console.log('Currency update:', { currencyCode, currencySymbol });

    return NextResponse.json({
      success: true,
      message: 'Currency updated successfully',
      data: { currencyCode, currencySymbol }
    });
  } catch (error) {
    console.error('Error updating currency:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update currency' },
      { status: 500 }
    );
  }
}
